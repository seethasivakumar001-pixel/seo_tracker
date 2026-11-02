import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_FILE = path.join(__dirname, "../config/gsc_credentials.json");
const CREDENTIALS_BY_DOMAIN_FILE = path.join(__dirname, "../config/gsc_credentials_by_domain.json");

// Helper to normalize domain strings
export function normalizeDomain(d) {
  if (!d) return "";
  return String(d)
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^sc-domain:/i, "")
    .replace(/\/.*$/, "")
    .trim();
}

// Helper to get domain-specific credentials map
function getDomainCredentialsMap() {
  if (fs.existsSync(CREDENTIALS_BY_DOMAIN_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CREDENTIALS_BY_DOMAIN_FILE, "utf-8"));
    } catch {}
  }
  return {};
}

// Helper to save domain credentials map
function saveDomainCredentialsMap(map) {
  fs.writeFileSync(CREDENTIALS_BY_DOMAIN_FILE, JSON.stringify(map, null, 2), "utf-8");
}

// Helper to get Google Auth client for a given domain
function getGSCAuth(domain = "") {
  const cleanDom = normalizeDomain(domain);

  // 1. Check if domain-specific credentials exist
  if (cleanDom) {
    const domainMap = getDomainCredentialsMap();
    const domainCreds = domainMap[cleanDom];
    if (domainCreds) {
      if (domainCreds.client_email && domainCreds.private_key) {
        return new google.auth.JWT({
          email: domainCreds.client_email,
          key: domainCreds.private_key.replace(/\\n/g, "\n"),
          scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
        });
      }
      if (domainCreds.access_token) {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: domainCreds.access_token });
        return oauth2Client;
      }
    }
  }

  // 2. Check local default/global credentials file
  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf-8"));
      if (creds.client_email && creds.private_key) {
        return new google.auth.JWT({
          email: creds.client_email,
          key: creds.private_key.replace(/\\n/g, "\n"),
          scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
        });
      }
      if (creds.access_token) {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: creds.access_token });
        return oauth2Client;
      }
    } catch (e) {
      console.warn("Failed to parse gsc_credentials.json:", e.message);
    }
  }

  // 3. Check environment variables
  if (process.env.GSC_SERVICE_ACCOUNT_JSON) {
    try {
      const creds = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON);
      return new google.auth.JWT({
        email: creds.client_email,
        key: creds.private_key.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
      });
    } catch {}
  }

  if (process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY) {
    return new google.auth.JWT({
      email: process.env.GSC_CLIENT_EMAIL,
      key: process.env.GSC_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
  }

  return null;
}

// GET /api/searchconsole/status - Check connection & whether target domain is verified
router.get("/status", async (req, res) => {
  try {
    const targetDomain = req.query.domain || "";
    const cleanTarget = normalizeDomain(targetDomain);

    const auth = getGSCAuth(cleanTarget);
    if (!auth) {
      return res.json({
        connected: false,
        hasCredentials: false,
        targetDomain,
        message: "No Google Search Console credentials configured.",
        configuredType: "none",
        sites: [],
      });
    }

    const searchconsole = google.searchconsole({ version: "v1", auth });
    let sites = [];
    try {
      const siteListRes = await searchconsole.sites.list();
      sites = (siteListRes.data.siteEntry || []).map((s) => ({
        siteUrl: s.siteUrl,
        permissionLevel: s.permissionLevel,
      }));
    } catch (err) {
      console.warn("GSC sites.list warning:", err.message);
    }

    // Check if the requested domain is actually verified in this account
    let isDomainVerified = false;
    let matchedSiteUrl = null;

    if (cleanTarget) {
      for (const s of sites) {
        const siteClean = normalizeDomain(s.siteUrl);
        if (siteClean === cleanTarget || siteClean.includes(cleanTarget) || cleanTarget.includes(siteClean)) {
          isDomainVerified = true;
          matchedSiteUrl = s.siteUrl;
          break;
        }
      }
    } else {
      // If no domain requested, connected if at least one site exists
      isDomainVerified = sites.length > 0;
    }

    // Check if domain has dedicated credentials
    const domainMap = getDomainCredentialsMap();
    const hasDomainSpecificCreds = Boolean(cleanTarget && domainMap[cleanTarget]);

    return res.json({
      connected: isDomainVerified,
      hasCredentials: true,
      hasDomainSpecificCreds,
      isDomainVerified,
      targetDomain,
      matchedSiteUrl,
      configuredType: auth.email ? "service_account" : "oauth_token",
      email: auth.email || null,
      sites,
      message: isDomainVerified
        ? `Google Search Console is verified and active for ${targetDomain || matchedSiteUrl}.`
        : targetDomain
        ? `Service account (${auth.email || "configured account"}) has access to: ${sites.map((s) => s.siteUrl).join(", ") || "none"}, but not "${targetDomain}".`
        : "Google Search Console API authenticated.",
    });
  } catch (err) {
    return res.status(500).json({
      connected: false,
      error: "Authentication error: " + err.message,
    });
  }
});

// POST /api/searchconsole/credentials - Save Service Account JSON or Token (per-domain or global)
router.post("/credentials", (req, res) => {
  try {
    const { domain, jsonKey, clientEmail, privateKey, accessToken } = req.body;
    let credsToSave = {};

    if (jsonKey) {
      const parsed = typeof jsonKey === "string" ? JSON.parse(jsonKey) : jsonKey;
      if (!parsed.client_email || !parsed.private_key) {
        return res.status(400).json({ error: "Invalid Service Account JSON key. Missing client_email or private_key." });
      }
      credsToSave = {
        client_email: parsed.client_email,
        private_key: parsed.private_key,
        project_id: parsed.project_id || "gsc-project",
        saved_at: new Date().toISOString(),
      };
    } else if (clientEmail && privateKey) {
      credsToSave = {
        client_email: clientEmail,
        private_key: privateKey,
        saved_at: new Date().toISOString(),
      };
    } else if (accessToken) {
      credsToSave = {
        access_token: accessToken,
        saved_at: new Date().toISOString(),
      };
    } else {
      return res.status(400).json({ error: "Please provide either a Service Account JSON, credentials, or an Access Token." });
    }

    const cleanDom = normalizeDomain(domain);
    if (cleanDom) {
      // Save specifically for this domain
      const domainMap = getDomainCredentialsMap();
      domainMap[cleanDom] = credsToSave;
      saveDomainCredentialsMap(domainMap);
    } else {
      // Save globally
      fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credsToSave, null, 2), "utf-8");
    }

    return res.json({
      success: true,
      message: cleanDom
        ? `Google Search Console credentials saved specifically for ${cleanDom}.`
        : "Google Search Console credentials saved globally.",
      domain: cleanDom || "global",
      clientEmail: credsToSave.client_email || null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save credentials: " + err.message });
  }
});

// DELETE /api/searchconsole/credentials - Disconnect GSC (for a domain or globally)
router.delete("/credentials", (req, res) => {
  try {
    const targetDomain = req.query.domain || req.body?.domain || "";
    const cleanDom = normalizeDomain(targetDomain);

    if (cleanDom) {
      const domainMap = getDomainCredentialsMap();
      if (domainMap[cleanDom]) {
        delete domainMap[cleanDom];
        saveDomainCredentialsMap(domainMap);
        return res.json({ success: true, message: `Google Search Console disconnected for ${cleanDom}.` });
      }
    }

    // If global disconnect requested
    if (fs.existsSync(CREDENTIALS_FILE)) {
      fs.unlinkSync(CREDENTIALS_FILE);
    }
    res.json({ success: true, message: "Google Search Console global credentials removed." });
  } catch (err) {
    res.status(500).json({ error: "Failed to disconnect: " + err.message });
  }
});

// POST /api/searchconsole/query - Run Search Analytics query for a specific site
router.post("/query", async (req, res) => {
  try {
    const {
      siteUrl,
      startDate = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
      endDate = new Date().toISOString().split("T")[0],
      dimensions = ["date"],
      rowLimit = 500,
    } = req.body;

    if (!siteUrl) {
      return res.status(400).json({ error: "Missing required parameter: siteUrl" });
    }

    const cleanTarget = normalizeDomain(siteUrl);
    const auth = getGSCAuth(cleanTarget);

    if (!auth) {
      return res.status(401).json({
        error: `Google Search Console is not configured for ${cleanTarget}.`,
        requiresSetup: true,
      });
    }

    const searchconsole = google.searchconsole({ version: "v1", auth });

    // Clean siteUrl candidates (Domain property format vs URL-prefix format)
    const siteUrlCandidates = [
      siteUrl,
      `sc-domain:${cleanTarget}`,
      `https://${cleanTarget}/`,
      `http://${cleanTarget}/`,
    ];

    let lastError = null;
    let queryResponse = null;
    let successfulSiteUrl = null;

    // Try candidates until one works
    for (const candidate of siteUrlCandidates) {
      try {
        queryResponse = await searchconsole.searchanalytics.query({
          siteUrl: candidate,
          requestBody: {
            startDate,
            endDate,
            dimensions,
            rowLimit,
          },
        });
        successfulSiteUrl = candidate;
        break;
      } catch (err) {
        lastError = err;
        // If 403 or 404, try next candidate
        if (err.code !== 403 && err.code !== 404) {
          break;
        }
      }
    }

    if (!queryResponse) {
      return res.status(400).json({
        error:
          `Google Search Console query failed for ${cleanTarget}: ` +
          (lastError?.message || "Property not found or unauthorized."),
        details: lastError?.response?.data || null,
        serviceEmail: auth.email || null,
        siteUrlTried: siteUrlCandidates,
      });
    }

    const rawRows = queryResponse.data.rows || [];

    // Calculate totals
    let totalClicks = 0;
    let totalImpressions = 0;
    let weightedPositionSum = 0;

    const formattedRows = rawRows.map((r) => {
      const clicks = Number(r.clicks) || 0;
      const impressions = Number(r.impressions) || 0;
      const ctr = Number(r.ctr) || (impressions > 0 ? clicks / impressions : 0);
      const position = Number(r.position) || 0;

      totalClicks += clicks;
      totalImpressions += impressions;
      weightedPositionSum += position * impressions;

      const entry = {
        keys: r.keys || [],
        clicks,
        impressions,
        ctr: Math.round(ctr * 10000) / 100,
        position: Math.round(position * 10) / 10,
      };

      dimensions.forEach((dim, idx) => {
        if (r.keys && r.keys[idx]) {
          entry[dim] = r.keys[idx];
        }
      });

      return entry;
    });

    const avgCtr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0;
    const avgPosition =
      totalImpressions > 0 ? Math.round((weightedPositionSum / totalImpressions) * 10) / 10 : 0;

    res.json({
      success: true,
      siteUrl: successfulSiteUrl,
      startDate,
      endDate,
      dimensions,
      totals: {
        clicks: totalClicks,
        impressions: totalImpressions,
        avgCtr,
        avgPosition,
      },
      rows: formattedRows,
    });
  } catch (err) {
    res.status(500).json({
      error: "Error querying Google Search Console: " + err.message,
    });
  }
});

export default router;
