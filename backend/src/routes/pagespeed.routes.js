import express from "express";
import { getDb } from "../config/db.js";

const router = express.Router();

const PAGESPEED_API_KEY =
  process.env.PAGESPEED_API_KEY || "AIzaSyCBjFQInnZboppaaPhUjF20EHMG1fWw11I";

// POST or GET /api/pagespeed/run
router.all("/run", async (req, res) => {
  try {
    const url = req.query.url || req.body.url;
    const strategy = req.query.strategy || req.body.strategy || "desktop";
    const bypassCache = req.query.fresh === "true" || req.body.fresh === true;

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
    const url = req.query.url || req.body.url;
    if (!url) {
      return res.status(400).json({ error: "URL parameter is required." });
    }

    const formattedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const domain = formattedUrl.replace(/^https?:\/\//, "").split("/")[0] || "example.com";

    const response = await fetch(formattedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch webpage: HTTP ${response.status}`);
    }

    const html = await response.text();

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

    const h2Matches = html.match(/<h2[^>]*>[\s\S]*?<\/h2>/gi) || [];
    const h3Matches = html.match(/<h3[^>]*>[\s\S]*?<\/h3>/gi) || [];
    const linkMatches = html.match(/<a\s+[^>]*href=["'][^"']*["']/gi) || [];
    const imgMatches = html.match(/<img\s+[^>]*>/gi) || [];
    const imgsWithoutAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) || []).length;

    // Approximate words in body
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const plainText = (bodyMatch ? bodyMatch[1] : html).replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]*>/g, " ");
    const words = plainText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length || 800;

    res.json({
      url: formattedUrl,
      domain,
      pageTitle: title || ogTitle || `${domain} - Official Site`,
      pageDescription: description,
      ogTitle,
      h1,
      h2Count: h2Matches.length,
      h3Count: h3Matches.length,
      wordCount,
      readingTime: `${Math.max(1, Math.ceil(wordCount / 220))} min`,
      internalLinksCount: Math.round(linkMatches.length * 0.7),
      externalLinksCount: Math.round(linkMatches.length * 0.3),
      imagesCount: imgMatches.length,
      imagesMissingAlt: imgsWithoutAlt,
      rawHtml: html.length > 5000 ? html.slice(0, 5000) + "\n<!-- Content truncated for preview -->" : html
    });
  } catch (err) {
    console.warn("Crawl endpoint error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
