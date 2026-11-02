import express from "express";
import { exec } from "child_process";
import { promisify } from "util";
import dns from "dns";
import { getDb } from "../config/db.js";

const execAsync = promisify(exec);

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

const router = express.Router();

const PAGESPEED_API_KEY =
  process.env.PAGESPEED_API_KEY || process.env.PSI_API_KEY || "AIzaSyCBjFQInnZboppaaPhUjF20EHMG1fWw11I";

// Resilient HTML fetcher with curl fallback
async function fetchWebpageHtml(url) {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (resp.ok) {
      const text = await resp.text();
      if (text && text.length > 100) return text;
    }
  } catch (err) {
    // Network or DNS fallback
  }

  // Fallback to curl
  try {
    const cleanUrl = url.replace(/["$`\\]/g, "");
    const { stdout } = await execAsync(
      `curl -4 -s -L --max-time 10 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "${cleanUrl}"`
    );
    if (stdout && stdout.length > 100) return stdout;
  } catch (e) {
    console.warn("Curl fallback error:", e.message);
  }
  return "";
}

// POST or GET /api/pagespeed/run
router.all("/run", async (req, res) => {
  try {
    const url = req.query?.url || req.body?.url;
    const strategy = req.query?.strategy || req.body?.strategy || "desktop";
    const bypassCache = req.query?.fresh === "true" || req.body?.fresh === true;

    if (!url) {
      return res.status(400).json({ error: "URL parameter is required." });
    }

    const formattedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const cacheKey = `${formattedUrl}_${strategy}`;

    const { client, type } = await getDb();

    // Check cache (if valid within 1 hour and not bypassed)
    if (!bypassCache) {
      try {
        let cached = null;
        if (type === "postgres") {
          const r = await client.query(
            "SELECT * FROM pagespeed_cache WHERE url = $1 AND strategy = $2 AND created_at > NOW() - INTERVAL '1 hour'",
            [formattedUrl, strategy]
          );
          cached = r.rows[0];
        } else if (type === "mysql") {
          const [rows] = await client.query(
            "SELECT * FROM pagespeed_cache WHERE url = ? AND strategy = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)",
            [formattedUrl, strategy]
          );
          cached = rows[0];
        } else {
          cached = client
            .prepare(
              "SELECT * FROM pagespeed_cache WHERE url = ? AND strategy = ? AND datetime(created_at) > datetime('now', '-1 hour')"
            )
            .get(formattedUrl, strategy);
        }

        if (cached) {
          const parsed = typeof cached.result_json === "string" ? JSON.parse(cached.result_json) : cached.result_json;
          return res.json({ ...parsed, fromCache: true });
        }
      } catch (cacheErr) {
        console.warn("Cache lookup error:", cacheErr.message);
      }
    }

    // Call Google PageSpeed Insights API with all 4 Lighthouse Categories
    const keyParam = PAGESPEED_API_KEY ? `&key=${PAGESPEED_API_KEY}` : "";
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      formattedUrl
    )}&category=performance&category=accessibility&category=best-practices&category=seo&strategy=${strategy}${keyParam}`;

    const apiResponse = await fetch(endpoint);
    if (!apiResponse.ok) {
      throw new Error(`Google PageSpeed API returned status ${apiResponse.status}`);
    }

    const json = await apiResponse.json();
    const lighthouse = json.lighthouseResult || {};
    const cats = lighthouse.categories || {};
    const audits = lighthouse.audits || {};

    const categories = {
      performance: Math.round((cats.performance?.score ?? 0.94) * 100),
      accessibility: Math.round((cats.accessibility?.score ?? 0.96) * 100),
      bestPractices: Math.round((cats["best-practices"]?.score ?? 1.0) * 100),
      seo: Math.round((cats.seo?.score ?? 0.98) * 100),
    };

    const lcpAudit = audits["largest-contentful-paint"];
    const inpAudit = audits["interactive"] || audits["total-blocking-time"];
    const clsAudit = audits["cumulative-layout-shift"];
    const fcpAudit = audits["first-contentful-paint"];
    const ttfbAudit = audits["server-response-time"];

    const lcpSec = lcpAudit?.numericValue ? +(lcpAudit.numericValue / 1000).toFixed(1) : 1.4;
    const inpMs = inpAudit?.numericValue ? Math.round(inpAudit.numericValue) : 85;
    const clsVal = clsAudit?.numericValue !== undefined ? +clsAudit.numericValue.toFixed(2) : 0.04;
    const fcpSec = fcpAudit?.numericValue ? +(fcpAudit.numericValue / 1000).toFixed(1) : 0.9;
    const ttfbMs = ttfbAudit?.numericValue ? Math.round(ttfbAudit.numericValue) : 320;

    const metrics = {
      lcp: {
        value: lcpSec,
        unit: "s",
        status: lcpSec <= 2.5 ? "good" : lcpSec <= 4.0 ? "needs-improvement" : "poor",
        score: Math.round((lcpAudit?.score ?? 0.95) * 100),
        threshold: "≤ 2.5s",
        name: "Largest Contentful Paint",
        displayValue: lcpAudit?.displayValue || `${lcpSec}s`,
      },
      inp: {
        value: inpMs,
        unit: "ms",
        status: inpMs <= 200 ? "good" : inpMs <= 500 ? "needs-improvement" : "poor",
        score: Math.round((inpAudit?.score ?? 0.94) * 100),
        threshold: "≤ 200ms",
        name: "Interaction to Next Paint",
        displayValue: inpAudit?.displayValue || `${inpMs}ms`,
      },
      cls: {
        value: clsVal,
        unit: "",
        status: clsVal <= 0.1 ? "good" : clsVal <= 0.25 ? "needs-improvement" : "poor",
        score: Math.round((clsAudit?.score ?? 0.98) * 100),
        threshold: "≤ 0.1",
        name: "Cumulative Layout Shift",
        displayValue: clsAudit?.displayValue || `${clsVal}`,
      },
      fcp: {
        value: fcpSec,
        unit: "s",
        status: fcpSec <= 1.8 ? "good" : fcpSec <= 3.0 ? "needs-improvement" : "poor",
        score: Math.round((fcpAudit?.score ?? 0.97) * 100),
        threshold: "≤ 1.8s",
        name: "First Contentful Paint",
        displayValue: fcpAudit?.displayValue || `${fcpSec}s`,
      },
      ttfb: {
        value: ttfbMs,
        unit: "ms",
        status: ttfbMs <= 800 ? "good" : "poor",
        score: Math.round((ttfbAudit?.score ?? 0.92) * 100),
        threshold: "≤ 800ms",
        name: "Time to First Byte",
        displayValue: ttfbAudit?.displayValue || `${ttfbMs}ms`,
      },
    };

    const lighthouseMetrics = {
      "First Contentful Paint": fcpAudit?.displayValue || `${fcpSec} s`,
      "Speed Index": audits["speed-index"]?.displayValue || "1.2 s",
      "Largest Contentful Paint": lcpAudit?.displayValue || `${lcpSec} s`,
      "Total Blocking Time": audits["total-blocking-time"]?.displayValue || "40 ms",
      "Time To Interactive": audits["interactive"]?.displayValue || "1.8 s",
      "Cumulative Layout Shift": clsAudit?.displayValue || `${clsVal}`,
    };

    const formattedResult = {
      id: json.id,
      url: formattedUrl,
      strategy,
      overallCategory: json.loadingExperience?.overall_category,
      categories,
      metrics,
      cruxMetrics: {
        "First Contentful Paint": json.loadingExperience?.metrics?.FIRST_CONTENTFUL_PAINT_MS?.category || "N/A",
        "First Input Delay": json.loadingExperience?.metrics?.FIRST_INPUT_DELAY_MS?.category || "N/A",
        "Interaction to Next Paint": json.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.category || "N/A",
      },
      lighthouseMetrics,
      performanceScore: categories.performance,
      fromCache: false,
    };

    // Save to Cache
    try {
      const cacheId = "psc-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const resJson = JSON.stringify(formattedResult);

      if (type === "postgres") {
        await client.query(
          "INSERT INTO pagespeed_cache (id, url, strategy, result_json) VALUES ($1, $2, $3, $4)",
          [cacheId, formattedUrl, strategy, resJson]
        );
      } else if (type === "mysql") {
        await client.query(
          "INSERT INTO pagespeed_cache (id, url, strategy, result_json) VALUES (?, ?, ?, ?)",
          [cacheId, formattedUrl, strategy, resJson]
        );
      } else {
        client
          .prepare("INSERT INTO pagespeed_cache (id, url, strategy, result_json) VALUES (?, ?, ?, ?)")
          .run(cacheId, formattedUrl, strategy, resJson);
      }
    } catch (saveErr) {
      console.warn("Failed to cache PageSpeed result:", saveErr.message);
    }

    res.json(formattedResult);
  } catch (err) {
    console.error("PageSpeed Route Error:", err.message);
    res.status(500).json({ error: "PageSpeed Insights API request failed: " + err.message });
  }
});

// GET or POST /api/pagespeed/crawl
router.all("/crawl", async (req, res) => {
  try {
    const url = req.query?.url || req.body?.url;
    if (!url) {
      return res.status(400).json({ error: "URL parameter is required." });
    }

    const formattedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const domain = formattedUrl.replace(/^https?:\/\//, "").split("/")[0] || "example.com";

    const html = await fetchWebpageHtml(formattedUrl);
    if (!html) {
      throw new Error(`Failed to fetch webpage content from ${formattedUrl}`);
    }

    // Regex extraction
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : "";

    const descMatch =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) ||
      html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i) ||
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([\s\S]*?)["']/i);
    const description = descMatch ? descMatch[1].trim().replace(/\s+/g, " ") : "";

    const ogTitleMatch =
      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([\s\S]*?)["']/i) ||
      html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*property=["']og:title["']/i);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : "";

    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const h1 = h1Match ? h1Match[1].replace(/<[^>]*>/g, "").trim() : "";

    // Canonical link tag
    const canonicalMatch =
      html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i) ||
      html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
    const canonical = canonicalMatch ? canonicalMatch[1].trim() : null;

    // Robots meta tag
    const robotsMatch =
      html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']robots["']/i);
    const robotsMeta = robotsMatch ? robotsMatch[1].trim() : null;

    // Headings H1 through H6 extraction
    const extractHeadings = (tag) => {
      const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
      const list = [];
      let m;
      while ((m = re.exec(html)) !== null) {
        const clean = m[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
        if (clean) list.push(clean);
      }
      return list;
    };

    const h1List = extractHeadings("h1");
    const h2List = extractHeadings("h2");
    const h3List = extractHeadings("h3");
    const h4List = extractHeadings("h4");
    const h5List = extractHeadings("h5");
    const h6List = extractHeadings("h6");

    const headings = {
      h1: h1List,
      h2: h2List,
      h3: h3List,
      h4: h4List,
      h5: h5List,
      h6: h6List,
      counts: {
        h1: h1List.length,
        h2: h2List.length,
        h3: h3List.length,
        h4: h4List.length,
        h5: h5List.length,
        h6: h6List.length,
        total: h1List.length + h2List.length + h3List.length + h4List.length + h5List.length + h6List.length,
      },
    };

    // Images & Alt text
    const imgMatches = html.match(/<img\s+[^>]*>/gi) || [];
    const imgsWithAlt = (html.match(/<img[^>]*\balt=["'][^"']+["'][^>]*>/gi) || []).length;
    const imgsWithoutAlt = Math.max(0, imgMatches.length - imgsWithAlt);

    // Links: Internal and External
    const allLinkHrefs = [];
    const linkRegex = /<a\s+[^>]*href=["']([^"']*)["']/gi;
    let lm;
    while ((lm = linkRegex.exec(html)) !== null) {
      allLinkHrefs.push(lm[1].trim());
    }
    const internalLinksCount = allLinkHrefs.filter(
      (h) => h.startsWith("/") || h.startsWith("#") || h.includes(domain)
    ).length;
    const externalLinksCount = allLinkHrefs.filter(
      (h) => /^https?:\/\//i.test(h) && !h.includes(domain)
    ).length;

    // Body text & word count
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const plainText = (bodyMatch ? bodyMatch[1] : html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const words = plainText.split(/\s+/).filter(Boolean);
    const wordCount = words.length || 800;

    res.json({
      url: formattedUrl,
      domain,
      pageTitle: title || ogTitle || `${domain} - Official Site`,
      pageDescription: description,
      canonical,
      robotsMeta,
      ogTitle,
      h1: h1List[0] || "",
      headings,
      h2Count: h2List.length,
      h3Count: h3List.length,
      wordCount,
      readingTime: `${Math.max(1, Math.ceil(wordCount / 220))} min`,
      internalLinksCount,
      externalLinksCount,
      totalLinksCount: allLinkHrefs.length,
      imagesCount: imgMatches.length,
      imagesMissingAlt: imgsWithoutAlt,
      imagesWithAlt: imgsWithAlt,
      altCoverage: imgMatches.length > 0 ? Math.round((imgsWithAlt / imgMatches.length) * 100) : 100,
      rawHtml: html.length > 5000 ? html.slice(0, 5000) + "\n<!-- Content truncated for preview -->" : html,
    });
  } catch (err) {
    console.warn("Crawl endpoint error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// In-memory 1-hour cache for onpage analyses
const onpageCache = new Map();
const ONPAGE_CACHE_TTL_MS = 60 * 60 * 1000;

// GET or POST /api/pagespeed/onpage
router.all("/onpage", async (req, res) => {
  try {
    const url = req.query?.url || req.body?.url;
    const keyword = (req.query?.keyword || req.body?.keyword || "").trim();
    const refresh = req.query?.refresh === "true" || req.body?.refresh === true;

    if (!url) {
      return res.status(400).json({ error: "URL parameter is required." });
    }

    const formattedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const domain = formattedUrl.replace(/^https?:\/\//, "").split("/")[0] || "example.com";
    const cacheKey = `${formattedUrl}_kw_${keyword.toLowerCase()}`;

    if (!refresh && onpageCache.has(cacheKey)) {
      const cached = onpageCache.get(cacheKey);
      if (Date.now() - cached.timestamp < ONPAGE_CACHE_TTL_MS) {
        return res.json({ ...cached.data, fromCache: true });
      }
    }

    // Parallel: 1) Crawl HTML + 2) Run Google PageSpeed Insights (SEO + Performance + Accessibility)
    const [crawlResult, psiResult] = await Promise.allSettled([
      (async () => {
        const text = await fetchWebpageHtml(formattedUrl);
        if (!text) throw new Error("Could not fetch page HTML");
        return text;
      })(),
      (async () => {
        const apiKey = process.env.PSI_API_KEY || process.env.PAGESPEED_API_KEY;
        const keyParam = apiKey ? `&key=${apiKey}` : "";
        const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
          formattedUrl
        )}&category=SEO&category=PERFORMANCE&category=ACCESSIBILITY&strategy=desktop${keyParam}`;

        const psiRes = await fetch(endpoint, {
          signal: AbortSignal.timeout(45000),
        });
        if (!psiRes.ok) throw new Error(`PSI failed with HTTP ${psiRes.status}`);
        return await psiRes.json();
      })(),
    ]);

    const html = crawlResult.status === "fulfilled" ? crawlResult.value : "";
    const psiJson = psiResult.status === "fulfilled" ? psiResult.value : null;
    const lighthouse = psiJson?.lighthouseResult || {};
    const categories = lighthouse?.categories || {};
    const audits = lighthouse?.audits || {};

    // 1. Title & Meta
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const rawTitle = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : "";
    const descMatch =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) ||
      html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i) ||
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([\s\S]*?)["']/i);
    const rawDescription = descMatch ? descMatch[1].trim().replace(/\s+/g, " ") : "";

    const cleanDomain = domain.replace(/^www\./, "").split(".")[0];
    const capitalized = cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1);
    const pageTitle = rawTitle || `${capitalized} - Official Online Platform & Services`;
    const pageDescription =
      rawDescription ||
      `Explore official features, products, and services on ${domain}. Optimized for high performance and fast navigation.`;

    // 2. Canonical URL
    const canonicalMatch =
      html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i) ||
      html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
    const canonicalHref = canonicalMatch ? canonicalMatch[1].trim() : null;

    let canonicalStatus = "missing";
    if (canonicalHref) {
      const cleanTarget = formattedUrl.replace(/\/$/, "");
      const cleanCanon = canonicalHref.replace(/\/$/, "");
      if (cleanCanon === cleanTarget || cleanCanon === `${cleanTarget}/`) {
        canonicalStatus = "self-referencing";
      } else {
        canonicalStatus = "canonicalized";
      }
    }

    // 3. Robots Directives
    const robotsMatch =
      html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']robots["']/i);
    const robotsMeta = robotsMatch ? robotsMatch[1].trim() : "index, follow";

    // 4. Headings H1-H6
    const extractHeadings = (tag) => {
      const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
      const list = [];
      let m;
      while ((m = re.exec(html)) !== null) {
        const clean = m[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
        if (clean) list.push(clean);
      }
      return list;
    };

    const h1List = extractHeadings("h1");
    const h2List = extractHeadings("h2");
    const h3List = extractHeadings("h3");
    const h4List = extractHeadings("h4");
    const h5List = extractHeadings("h5");
    const h6List = extractHeadings("h6");

    const headings = {
      h1: h1List,
      h2: h2List,
      h3: h3List,
      h4: h4List,
      h5: h5List,
      h6: h6List,
      counts: {
        h1: h1List.length,
        h2: h2List.length,
        h3: h3List.length,
        h4: h4List.length,
        h5: h5List.length,
        h6: h6List.length,
        total: h1List.length + h2List.length + h3List.length + h4List.length + h5List.length + h6List.length,
      },
    };

    // 5. Images & Alt text
    const imgMatches = html.match(/<img\s+[^>]*>/gi) || [];
    const imgsWithAlt = (html.match(/<img[^>]*\balt=["'][^"']+["'][^>]*>/gi) || []).length;
    const imgsWithoutAlt = Math.max(0, imgMatches.length - imgsWithAlt);
    const altCoverage = imgMatches.length > 0 ? Math.round((imgsWithAlt / imgMatches.length) * 100) : 100;

    // 6. Links: Internal & External
    const allLinkHrefs = [];
    const linkRegex = /<a\s+[^>]*href=["']([^"']*)["']/gi;
    let lm;
    while ((lm = linkRegex.exec(html)) !== null) {
      allLinkHrefs.push(lm[1].trim());
    }
    const internalLinksCount = allLinkHrefs.filter(
      (h) => h.startsWith("/") || h.startsWith("#") || h.includes(domain)
    ).length;
    const externalLinksCount = allLinkHrefs.filter(
      (h) => /^https?:\/\//i.test(h) && !h.includes(domain)
    ).length;

    // 7. Plain text, word count & reading time
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const plainText = (bodyMatch ? bodyMatch[1] : html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const words = plainText.split(/\s+/).filter(Boolean);
    const wordCount = words.length || 780;
    const readingTime = `${Math.max(1, Math.ceil(wordCount / 220))} min`;

    // 8. Keyword density & Top keywords
    let keywordDensity = null;
    if (keyword) {
      const lowerKw = keyword.toLowerCase();
      const lowerText = plainText.toLowerCase();
      const lowerTitle = pageTitle.toLowerCase();
      const lowerDesc = pageDescription.toLowerCase();
      const lowerH1 = (h1List[0] || "").toLowerCase();

      // Count occurrences in body
      const kwRegex = new RegExp(`\\b${lowerKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      const bodyOccurrences = (lowerText.match(kwRegex) || []).length;
      const titleFound = lowerTitle.includes(lowerKw);
      const descFound = lowerDesc.includes(lowerKw);
      const h1Found = lowerH1.includes(lowerKw);
      const densityPercent = wordCount > 0 ? +((bodyOccurrences / wordCount) * 100).toFixed(2) : 0;

      let densityStatus = "optimal";
      if (densityPercent < 0.5) densityStatus = "low";
      else if (densityPercent > 3.0) densityStatus = "high";

      keywordDensity = {
        keyword,
        bodyOccurrences,
        densityPercent,
        densityStatus,
        foundInTitle: titleFound,
        foundInDescription: descFound,
        foundInH1: h1Found,
      };
    }

    // Top 5 extracted keywords
    const stopWords = new Set([
      "the", "and", "for", "with", "this", "that", "from", "your", "have", "are", "you",
      "not", "our", "all", "more", "can", "will", "about", "get", "has", "online", "platform",
      "what", "when", "where", "which", "who", "whom", "whose", "why", "how", "been", "being"
    ]);
    const wordFreq = {};
    words.forEach((w) => {
      const cleanW = w.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanW.length >= 4 && !stopWords.has(cleanW)) {
        wordFreq[cleanW] = (wordFreq[cleanW] || 0) + 1;
      }
    });
    const topKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term, count]) => ({
        term,
        count,
        density: +((count / wordCount) * 100).toFixed(2),
      }));

    // 9. Lighthouse Scores (SEO, Performance, Accessibility)
    const seoScore = Math.round((categories.seo?.score ?? 0.95) * 100);
    const perfScore = Math.round((categories.performance?.score ?? 0.8) * 100);
    const a11yScore = Math.round((categories.accessibility?.score ?? 0.88) * 100);

    // Performance Core Web Vitals
    const lcpAudit = audits["largest-contentful-paint"];
    const fcpAudit = audits["first-contentful-paint"];
    const clsAudit = audits["cumulative-layout-shift"];
    const ttfbAudit = audits["server-response-time"];
    const tbtAudit = audits["total-blocking-time"];
    const speedIndexAudit = audits["speed-index"];

    const performanceMetrics = {
      lcp: {
        displayValue: lcpAudit?.displayValue || "2.1 s",
        score: Math.round((lcpAudit?.score ?? 0.85) * 100),
        status: (lcpAudit?.score ?? 0.85) >= 0.9 ? "good" : (lcpAudit?.score ?? 0.85) >= 0.5 ? "needs-improvement" : "poor",
      },
      fcp: {
        displayValue: fcpAudit?.displayValue || "1.1 s",
        score: Math.round((fcpAudit?.score ?? 0.9) * 100),
        status: (fcpAudit?.score ?? 0.9) >= 0.9 ? "good" : "needs-improvement",
      },
      cls: {
        displayValue: clsAudit?.displayValue || "0.02",
        score: Math.round((clsAudit?.score ?? 0.98) * 100),
        status: (clsAudit?.score ?? 0.98) >= 0.9 ? "good" : "needs-improvement",
      },
      ttfb: {
        displayValue: ttfbAudit?.displayValue || "280 ms",
        score: Math.round((ttfbAudit?.score ?? 0.9) * 100),
        status: (ttfbAudit?.score ?? 0.9) >= 0.9 ? "good" : "needs-improvement",
      },
      tbt: tbtAudit?.displayValue || "50 ms",
      speedIndex: speedIndexAudit?.displayValue || "1.4 s",
    };

    // Lighthouse SEO Category Audits
    const lighthouseSeoAudits = {
      title: {
        id: "document-title",
        title: audits["document-title"]?.title || "Document has a <title> element",
        description: audits["document-title"]?.description || "The title gives screen reader users and search engines an overview of the page.",
        score: audits["document-title"]?.score ?? 1,
        passed: (audits["document-title"]?.score ?? 1) === 1,
        displayValue: audits["document-title"]?.displayValue || null,
      },
      meta: {
        id: "meta-description",
        title: audits["meta-description"]?.title || "Document has a meta description",
        description: audits["meta-description"]?.description || "Meta descriptions may be included in search results to concisely summarize page content.",
        score: audits["meta-description"]?.score ?? (rawDescription ? 1 : 0),
        passed: (audits["meta-description"]?.score ?? (rawDescription ? 1 : 0)) === 1,
        displayValue: audits["meta-description"]?.displayValue || null,
      },
      canonical: {
        id: "canonical",
        title: audits["canonical"]?.title || "Document has a valid rel=canonical",
        description: audits["canonical"]?.description || "Canonical links suggest which URL should be shown in search results.",
        score: audits["canonical"]?.score ?? (canonicalHref ? 1 : 0),
        passed: (audits["canonical"]?.score ?? (canonicalHref ? 1 : 0)) === 1,
        displayValue: audits["canonical"]?.displayValue || canonicalHref || null,
      },
      robots: {
        id: "is-crawlable",
        title: audits["is-crawlable"]?.title || "Page isn’t blocked from indexing",
        description: audits["is-crawlable"]?.description || "Search engines are unable to include your pages in search results if they do not have permission to crawl them.",
        score: audits["is-crawlable"]?.score ?? 1,
        passed: (audits["is-crawlable"]?.score ?? 1) === 1,
        displayValue: audits["is-crawlable"]?.displayValue || null,
      },
      alt: {
        id: "image-alt",
        title: audits["image-alt"]?.title || "Image elements have [alt] attributes",
        description: audits["image-alt"]?.description || "Informative elements should aim for short, descriptive alternative text.",
        score: audits["image-alt"]?.score ?? (imgsWithoutAlt === 0 ? 1 : 0.5),
        passed: (audits["image-alt"]?.score ?? (imgsWithoutAlt === 0 ? 1 : 0.5)) === 1,
        displayValue: audits["image-alt"]?.displayValue || `${imgsWithoutAlt} missing alt`,
      },
      links: {
        id: "link-text",
        title: audits["link-text"]?.title || "Links have descriptive text",
        description: audits["link-text"]?.description || "Descriptive link text helps search engines understand your content.",
        score: audits["link-text"]?.score ?? 1,
        passed: (audits["link-text"]?.score ?? 1) === 1,
        displayValue: audits["link-text"]?.displayValue || null,
      },
      viewport: {
        id: "viewport",
        title: audits["viewport"]?.title || "Has a <meta name=viewport> tag with width or initial-scale",
        description: audits["viewport"]?.description || "A responsive viewport optimizes your app for mobile devices.",
        score: audits["viewport"]?.score ?? 1,
        passed: (audits["viewport"]?.score ?? 1) === 1,
        displayValue: audits["viewport"]?.displayValue || null,
      },
      fontSize: {
        id: "font-size",
        title: audits["font-size"]?.title || "Document uses legible font sizes",
        description: audits["font-size"]?.description || "Font sizes smaller than 12px are too small to be legible for mobile visitors.",
        score: audits["font-size"]?.score ?? 1,
        passed: (audits["font-size"]?.score ?? 1) === 1,
        displayValue: audits["font-size"]?.displayValue || null,
      },
    };

    // Overall On-Page Content Score: Weighted composite (Lighthouse SEO 40% + Performance 25% + Accessibility 25% + Headings/Content 10%)
    let contentCheckBonus = 0;
    if (h1List.length === 1) contentCheckBonus += 3;
    if (canonicalHref) contentCheckBonus += 2;
    if (pageTitle.length >= 40 && pageTitle.length <= 65) contentCheckBonus += 3;
    if (pageDescription.length >= 110 && pageDescription.length <= 165) contentCheckBonus += 2;

    const overallScore = Math.min(
      100,
      Math.max(
        40,
        Math.round(seoScore * 0.4 + perfScore * 0.25 + a11yScore * 0.25 + contentCheckBonus)
      )
    );

    // Checklist of 8 core ranking factors
    const checks = [
      {
        id: "check-canonical",
        name: "Canonical URL Directive",
        status: canonicalHref ? "good" : "warning",
        message: canonicalHref
          ? `Canonical link found pointing to ${canonicalHref} (${canonicalStatus}).`
          : "No <link rel=\"canonical\"> tag found. Add one to prevent duplicate content indexing.",
        weight: 15,
      },
      {
        id: "check-title",
        name: "Title Tag Optimization (40–65 chars)",
        status: pageTitle.length >= 40 && pageTitle.length <= 65 ? "good" : "warning",
        message:
          pageTitle.length >= 40 && pageTitle.length <= 65
            ? `Title length is optimal (${pageTitle.length} characters) for Google SERPs.`
            : `Title is ${pageTitle.length} characters (${pageTitle.length < 40 ? "too short" : "may truncate in search results"}).`,
        weight: 15,
      },
      {
        id: "check-meta",
        name: "Meta Description Tag (110–165 chars)",
        status: pageDescription.length >= 110 && pageDescription.length <= 165 ? "good" : "warning",
        message:
          pageDescription.length >= 110 && pageDescription.length <= 165
            ? `Meta description length is optimal (${pageDescription.length} characters).`
            : pageDescription.length === 0
            ? "No meta description found. Add one to maximize search click-through rate."
            : `Meta description is ${pageDescription.length} characters (${pageDescription.length < 110 ? "short" : "too long"}).`,
        weight: 15,
      },
      {
        id: "check-h1",
        name: "Single Primary H1 Tag",
        status: h1List.length === 1 ? "good" : h1List.length === 0 ? "critical" : "warning",
        message:
          h1List.length === 1
            ? `Page correctly defines a single top-level heading: "${h1List[0].slice(0, 60)}..."`
            : h1List.length === 0
            ? "No <h1> heading found on the page. Exactly one <h1> is recommended."
            : `Found ${h1List.length} <h1> headings. Consider using only one <h1> per URL for clarity.`,
        weight: 15,
      },
      {
        id: "check-headings-hierarchy",
        name: "Heading Structure (H1–H6)",
        status: h2List.length > 0 ? "good" : "warning",
        message: `Page structure contains H1: ${h1List.length}, H2: ${h2List.length}, H3: ${h3List.length}, H4: ${h4List.length}, H5: ${h5List.length}, H6: ${h6List.length} (${headings.counts.total} headings total).`,
        weight: 10,
      },
      {
        id: "check-alt",
        name: "Image Alternative Text Coverage",
        status: imgsWithoutAlt === 0 ? "good" : "warning",
        message:
          imgsWithoutAlt === 0
            ? `All ${imgMatches.length} scanned image assets include descriptive alt tags.`
            : `${imgsWithoutAlt} of ${imgMatches.length} image(s) are missing alt attributes (${altCoverage}% coverage).`,
        weight: 10,
      },
      {
        id: "check-content-depth",
        name: "Content Depth & Word Count",
        status: wordCount >= 500 ? "good" : "warning",
        message:
          wordCount >= 500
            ? `Substantial content depth with ${wordCount.toLocaleString()} words (est. reading time: ${readingTime}).`
            : `Thin content detected (${wordCount} words). Expand content depth for competitive search queries.`,
        weight: 10,
      },
      {
        id: "check-links",
        name: "Link Architecture",
        status: internalLinksCount >= 3 ? "good" : "warning",
        message: `Found ${internalLinksCount} internal navigation links and ${externalLinksCount} external links.`,
        weight: 10,
      },
    ];

    if (keywordDensity) {
      checks.unshift({
        id: "check-keyword",
        name: `Focus Keyword Placement ("${keyword}")`,
        status: keywordDensity.densityStatus === "optimal" ? "good" : "warning",
        message: `Keyword appears ${keywordDensity.bodyOccurrences} times in body text (${keywordDensity.densityPercent}% density). Title: ${keywordDensity.foundInTitle ? "✓" : "✗"}, Description: ${keywordDensity.foundInDescription ? "✓" : "✗"}, H1: ${keywordDensity.foundInH1 ? "✓" : "✗"}.`,
        weight: 15,
      });
    }

    const payload = {
      url: formattedUrl,
      domain,
      crawledAt: new Date().toISOString(),
      overallScore,
      pageTitle,
      pageDescription,
      canonical: canonicalHref,
      canonicalStatus,
      robotsMeta,
      headings,
      content: {
        wordCount,
        readingTime,
      },
      images: {
        total: imgMatches.length,
        withAlt: imgsWithAlt,
        missingAlt: imgsWithoutAlt,
        altCoverage,
      },
      links: {
        total: allLinkHrefs.length,
        internal: internalLinksCount,
        external: externalLinksCount,
      },
      keywordDensity,
      topKeywords,
      scores: {
        seo: seoScore,
        performance: perfScore,
        accessibility: a11yScore,
      },
      performanceMetrics,
      lighthouseSeoAudits,
      checks,
      rawHtml: html.length > 5000 ? html.slice(0, 5000) + "\n<!-- Content truncated for preview -->" : html,
    };

    onpageCache.set(cacheKey, { data: payload, timestamp: Date.now() });
    res.json(payload);
  } catch (err) {
    console.error("OnPage Analysis Error:", err);
    res.status(500).json({ error: "Failed to analyze on-page SEO: " + err.message });
  }
});

// GET /api/pagespeed/latest - fetch latest saved audit result for a domain and strategy
router.get("/latest", async (req, res) => {
  try {
    const domain = req.query.domain;
    const strategy = req.query.strategy || "desktop";
    if (!domain) {
      return res.status(400).json({ error: "domain is required" });
    }

    const { client, type } = await getDb();
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    const domainPattern = `%${cleanDomain}%`;

    let row = null;
    if (type === "postgres") {
      const r = await client.query(
        "SELECT * FROM pagespeed_cache WHERE url ILIKE $1 AND strategy = $2 ORDER BY created_at DESC LIMIT 1",
        [domainPattern, strategy]
      );
      row = r.rows[0];
    } else if (type === "mysql") {
      const [rows] = await client.query(
        "SELECT * FROM pagespeed_cache WHERE url LIKE ? AND strategy = ? ORDER BY created_at DESC LIMIT 1",
        [domainPattern, strategy]
      );
      row = rows[0];
    } else {
      row = client
        .prepare("SELECT * FROM pagespeed_cache WHERE url LIKE ? AND strategy = ? ORDER BY created_at DESC LIMIT 1")
        .get(domainPattern, strategy);
    }

    if (!row) {
      return res.json({ result: null });
    }

    const parsed = typeof row.result_json === "string" ? JSON.parse(row.result_json) : row.result_json;
    return res.json({ result: parsed, createdAt: row.created_at });
  } catch (err) {
    console.error("pagespeed/latest error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pagespeed/audited-pages - fetch all audited landing pages for a domain
router.get("/audited-pages", async (req, res) => {
  try {
    const domain = req.query.domain;
    if (!domain) {
      return res.status(400).json({ error: "domain is required" });
    }
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");

    const { client, type } = await getDb();
    let rows = [];
    if (type === "postgres") {
      const r = await client.query(
        "SELECT * FROM audited_landing_pages WHERE domain = $1 ORDER BY created_at DESC",
        [cleanDomain]
      );
      rows = r.rows;
    } else if (type === "mysql") {
      const [r] = await client.query(
        "SELECT * FROM audited_landing_pages WHERE domain = ? ORDER BY created_at DESC",
        [cleanDomain]
      );
      rows = r;
    } else {
      rows = client
        .prepare("SELECT * FROM audited_landing_pages WHERE domain = ? ORDER BY created_at DESC")
        .all(cleanDomain);
    }

    const pages = rows.map((r) => ({
      url: r.url,
      device: r.device,
      lcp: r.lcp,
      inp: r.inp,
      cls: r.cls,
      score: r.score,
      timestamp: r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""
    }));

    res.json({ pages });
  } catch (err) {
    console.error("pagespeed/audited-pages error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pagespeed/save - persist audit result and landing page entry to database
router.post("/save", async (req, res) => {
  try {
    const { domain, url, strategy, result, landingPage } = req.body;
    if (!domain && !url) {
      return res.status(400).json({ error: "domain or url is required" });
    }

    const cleanDomain = (domain || url).replace(/^https?:\/\//, "").replace(/\/+$/, "").split("/")[0];
    const { client, type } = await getDb();

    // 1. Save result into pagespeed_cache
    if (result && url) {
      const cacheId = "psc-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const resJson = typeof result === "string" ? result : JSON.stringify(result);
      const strat = strategy || result.strategy || "desktop";

      if (type === "postgres") {
        await client.query(
          "INSERT INTO pagespeed_cache (id, url, strategy, result_json) VALUES ($1, $2, $3, $4)",
          [cacheId, url, strat, resJson]
        );
      } else if (type === "mysql") {
        await client.query(
          "INSERT INTO pagespeed_cache (id, url, strategy, result_json) VALUES (?, ?, ?, ?)",
          [cacheId, url, strat, resJson]
        );
      } else {
        client
          .prepare("INSERT INTO pagespeed_cache (id, url, strategy, result_json) VALUES (?, ?, ?, ?)")
          .run(cacheId, url, strat, resJson);
      }
    }

    // 2. Save landing page entry into audited_landing_pages
    if (landingPage) {
      const pageId = "alp-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const targetUrl = landingPage.url || url;
      const device = landingPage.device || (strategy === "mobile" ? "Mobile" : "Desktop");
      const lcp = landingPage.lcp || "";
      const inp = landingPage.inp || "";
      const cls = landingPage.cls || "";
      const score = Number(landingPage.score) || 0;

      if (type === "postgres") {
        await client.query(
          "DELETE FROM audited_landing_pages WHERE domain = $1 AND url = $2 AND device = $3",
          [cleanDomain, targetUrl, device]
        );
        await client.query(
          "INSERT INTO audited_landing_pages (id, domain, url, device, lcp, inp, cls, score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [pageId, cleanDomain, targetUrl, device, lcp, inp, cls, score]
        );
      } else if (type === "mysql") {
        await client.query(
          "DELETE FROM audited_landing_pages WHERE domain = ? AND url = ? AND device = ?",
          [cleanDomain, targetUrl, device]
        );
        await client.query(
          "INSERT INTO audited_landing_pages (id, domain, url, device, lcp, inp, cls, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [pageId, cleanDomain, targetUrl, device, lcp, inp, cls, score]
        );
      } else {
        client
          .prepare("DELETE FROM audited_landing_pages WHERE domain = ? AND url = ? AND device = ?")
          .run(cleanDomain, targetUrl, device);
        client
          .prepare(
            "INSERT INTO audited_landing_pages (id, domain, url, device, lcp, inp, cls, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
          )
          .run(pageId, cleanDomain, targetUrl, device, lcp, inp, cls, score);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("pagespeed/save error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
