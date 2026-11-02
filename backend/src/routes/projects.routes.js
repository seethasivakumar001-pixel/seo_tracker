import express from "express";
import { getDb } from "../config/db.js";

const router = express.Router();

function formatProjectRow(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    domain: p.domain || "",
    deletedAt: p.deleted_at || p.deletedAt || null,
    deletedWith: p.deleted_with || p.deletedWith || null,
  };
}

// GET /api/projects
router.get("/", async (req, res) => {
  try {
    const { client, type } = await getDb();
    let rows = [];

    if (type === "postgres") {
      const r = await client.query("SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at ASC");
      rows = r.rows;
    } else if (type === "mysql") {
      const [r] = await client.query("SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at ASC");
      rows = r;
    } else {
      rows = client.prepare("SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at ASC").all();
    }

    res.json(rows.map(formatProjectRow));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch projects: " + err.message });
  }
});

// POST /api/projects
router.post("/", async (req, res) => {
  try {
    const { id, name, domain } = req.body;
    if (!name) return res.status(400).json({ error: "Project name is required." });

    const projId = id || "proj-" + Date.now().toString(36);
    const { client, type } = await getDb();

    if (type === "postgres") {
      const r = await client.query(
        "INSERT INTO projects (id, name, domain) VALUES ($1, $2, $3) RETURNING *",
        [projId, name.trim(), domain || ""]
      );
      return res.status(201).json(formatProjectRow(r.rows[0]));
    } else if (type === "mysql") {
      await client.query("INSERT INTO projects (id, name, domain) VALUES (?, ?, ?)", [
        projId,
        name.trim(),
        domain || "",
      ]);
      const [r] = await client.query("SELECT * FROM projects WHERE id = ?", [projId]);
      return res.status(201).json(formatProjectRow(r[0]));
    } else {
      client
        .prepare("INSERT INTO projects (id, name, domain) VALUES (?, ?, ?)")
        .run(projId, name.trim(), domain || "");
      const r = client.prepare("SELECT * FROM projects WHERE id = ?").get(projId);
      return res.status(201).json(formatProjectRow(r));
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to create project: " + err.message });
  }
});

function toSqlDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// PUT / PATCH /api/projects/:id
const updateProjectHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, domain, deletedAt, deletedWith } = req.body;
    const { client, type } = await getDb();
    const parsedDeletedAt = toSqlDate(deletedAt);

    if (type === "postgres") {
      const r = await client.query(
        `UPDATE projects SET
          name = COALESCE($1, name),
          domain = COALESCE($2, domain),
          deleted_at = $3,
          deleted_with = $4
        WHERE id = $5 RETURNING *`,
        [name, domain, parsedDeletedAt, deletedWith || null, id]
      );
      return res.json(formatProjectRow(r.rows[0]));
    } else if (type === "mysql") {
      await client.query(
        `UPDATE projects SET
          name = COALESCE(?, name),
          domain = COALESCE(?, domain),
          deleted_at = ?,
          deleted_with = ?
        WHERE id = ?`,
        [name, domain, parsedDeletedAt, deletedWith || null, id]
      );
      const [r] = await client.query("SELECT * FROM projects WHERE id = ?", [id]);
      return res.json(formatProjectRow(r[0]));
    } else {
      client
        .prepare(
          `UPDATE projects SET
            name = COALESCE(?, name),
            domain = COALESCE(?, domain),
            deleted_at = ?,
            deleted_with = ?
          WHERE id = ?`
        )
        .run(name, domain, parsedDeletedAt ? parsedDeletedAt.toISOString() : null, deletedWith || null, id);
      const r = client.prepare("SELECT * FROM projects WHERE id = ?").get(id);
      return res.json(formatProjectRow(r));
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update project: " + err.message });
  }
};

router.put("/:id", updateProjectHandler);
router.patch("/:id", updateProjectHandler);

// DELETE /api/projects/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    const { client, type } = await getDb();

    if (permanent === "true") {
      if (type === "postgres") {
        await client.query("DELETE FROM projects WHERE id = $1", [id]);
        await client.query("DELETE FROM keywords WHERE project_id = $1", [id]);
        await client.query("DELETE FROM categories WHERE project_id = $1", [id]);
      } else if (type === "mysql") {
        await client.query("DELETE FROM projects WHERE id = ?", [id]);
        await client.query("DELETE FROM keywords WHERE project_id = ?", [id]);
        await client.query("DELETE FROM categories WHERE project_id = ?", [id]);
      } else {
        client.prepare("DELETE FROM projects WHERE id = ?").run(id);
        client.prepare("DELETE FROM keywords WHERE project_id = ?").run(id);
        client.prepare("DELETE FROM categories WHERE project_id = ?").run(id);
      }
      return res.json({ success: true, message: "Project and associated items deleted" });
    }

    const now = new Date();
    if (type === "postgres") {
      await client.query("UPDATE projects SET deleted_at = $1 WHERE id = $2", [now, id]);
    } else if (type === "mysql") {
      await client.query("UPDATE projects SET deleted_at = ? WHERE id = ?", [now, id]);
    } else {
      client.prepare("UPDATE projects SET deleted_at = ? WHERE id = ?").run(now.toISOString(), id);
    }
    res.json({ success: true, message: "Project moved to trash" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project: " + err.message });
  }
});

// In-memory 1-hour cache for PSI audits: key = `${projectId}_${strategy}`
const auditCache = new Map();
const AUDIT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const HEALTH_SCORE_WEIGHTS = {
  seo: 0.4,
  performance: 0.3,
  accessibility: 0.3,
};

function stripMarkdownLinks(text) {
  if (!text) return "";
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

// GET /api/projects/:projectId/audit?strategy=mobile|desktop&refresh=true
router.get("/:projectId/audit", async (req, res) => {
  try {
    const { projectId } = req.params;
    const strategy = (req.query.strategy === "mobile" ? "mobile" : "desktop");
    const refresh = req.query.refresh === "true" || req.query.refresh === true;

    const { client, type } = await getDb();
    let project = null;

    if (type === "postgres") {
      let r = await client.query("SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL", [projectId]);
      project = r.rows[0];
      if (!project) {
        r = await client.query("SELECT * FROM projects WHERE domain = $1 AND deleted_at IS NULL", [projectId]);
        project = r.rows[0];
      }
    } else if (type === "mysql") {
      let [r] = await client.query("SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL", [projectId]);
      project = r[0];
      if (!project) {
        [r] = await client.query("SELECT * FROM projects WHERE domain = ? AND deleted_at IS NULL", [projectId]);
        project = r[0];
      }
    } else {
      project = client.prepare("SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL").get(projectId);
      if (!project) {
        project = client.prepare("SELECT * FROM projects WHERE domain = ? AND deleted_at IS NULL").get(projectId);
      }
    }

    const queryUrl = (req.query.url || req.query.domain || "").trim();

    if (!project) {
      if (queryUrl) {
        const cleanDomain = queryUrl.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim();
        project = {
          id: projectId,
          name: cleanDomain || projectId,
          domain: cleanDomain,
        };
        try {
          if (type === "postgres") {
            await client.query(
              "INSERT INTO projects (id, name, domain) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
              [projectId, project.name, project.domain]
            );
          } else if (type === "mysql") {
            await client.query(
              "INSERT IGNORE INTO projects (id, name, domain) VALUES (?, ?, ?)",
              [projectId, project.name, project.domain]
            );
          } else {
            client.prepare("INSERT OR IGNORE INTO projects (id, name, domain) VALUES (?, ?, ?)").run(
              projectId,
              project.name,
              project.domain
            );
          }
        } catch (e) {
          console.warn("Auto-insert new project warning:", e.message);
        }
      } else {
        return res.status(404).json({ error: `Project '${projectId}' not found.` });
      }
    }

    const rawDomain = (project.domain || queryUrl || "").trim();
    if (!rawDomain) {
      return res.status(400).json({ error: "Project has no URL configured." });
    }

    const targetUrl = /^https?:\/\//i.test(rawDomain) ? rawDomain : `https://${rawDomain}/`;
    const cacheKey = `${project.id}_${strategy}`;

    // Return cached audit if valid within 1 hour and refresh is not requested
    if (!refresh && auditCache.has(cacheKey)) {
      const cached = auditCache.get(cacheKey);
      if (Date.now() - cached.timestamp < AUDIT_CACHE_TTL_MS) {
        return res.json({ ...cached.data, fromCache: true });
      }
    }

    const apiKey = process.env.PSI_API_KEY || process.env.PAGESPEED_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : "";
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      targetUrl
    )}&category=PERFORMANCE&category=ACCESSIBILITY&category=SEO&strategy=${strategy}${keyParam}`;

    const psiRes = await fetch(endpoint, {
      signal: AbortSignal.timeout(60000),
    });

    if (!psiRes.ok) {
      const status = psiRes.status;
      let errMsg = `PageSpeed Insights API failed with status ${status}`;
      try {
        const errJson = await psiRes.json();
        if (errJson?.error?.message) {
          errMsg = errJson.error.message;
        }
      } catch {}

      if (status === 400) {
        return res.status(400).json({
          error: `Invalid or inaccessible website URL (${targetUrl}). Please ensure the domain is publicly reachable.`,
        });
      }
      if (status === 429) {
        return res.status(429).json({
          error: "PageSpeed Insights API quota exceeded. Please try again later.",
        });
      }
      if (status === 500 || status === 503) {
        return res.status(status).json({
          error: "Google PageSpeed Insights service is temporarily unavailable. Please retry in a few moments.",
        });
      }
      return res.status(status).json({ error: errMsg });
    }

    const json = await psiRes.json();
    const lighthouse = json.lighthouseResult || {};
    const categories = lighthouse.categories || {};
    const audits = lighthouse.audits || {};

    const seoScore = Math.round((categories.seo?.score ?? 0) * 100);
    const perfScore = Math.round((categories.performance?.score ?? 0) * 100);
    const a11yScore = Math.round((categories.accessibility?.score ?? 0) * 100);

    const healthScore = Math.round(
      seoScore * HEALTH_SCORE_WEIGHTS.seo +
      perfScore * HEALTH_SCORE_WEIGHTS.performance +
      a11yScore * HEALTH_SCORE_WEIGHTS.accessibility
    );

    const categoriesOut = {
      onPage: { score: seoScore, critical: 0, warnings: 0 },
      performance: { score: perfScore, critical: 0, warnings: 0 },
      accessibility: { score: a11yScore, critical: 0, warnings: 0 },
    };

    const summary = { critical: 0, warnings: 0, passed: 0 };
    const issues = [];
    const seenIssueIds = new Set();

    const categoryKeys = [
      { key: "seo", categoryName: "seo", outKey: "onPage" },
      { key: "performance", categoryName: "performance", outKey: "performance" },
      { key: "accessibility", categoryName: "accessibility", outKey: "accessibility" },
    ];

    for (const { key, categoryName, outKey } of categoryKeys) {
      const catObj = categories[key];
      const auditRefs = catObj?.auditRefs || [];

      for (const ref of auditRefs) {
        const audit = audits[ref.id];
        if (!audit) continue;

        const mode = audit.scoreDisplayMode;
        if (mode === "notApplicable" || mode === "manual" || mode === "informative") {
          continue;
        }

        if (audit.score === null || audit.score === undefined) {
          continue;
        }

        let severity = null;
        if (audit.score === 1) severity = "passed";
        else if (audit.score === 0) severity = "critical";
        else if (audit.score > 0 && audit.score < 1) severity = "warning";
        else continue;

        if (severity === "critical") categoriesOut[outKey].critical += 1;
        else if (severity === "warning") categoriesOut[outKey].warnings += 1;

        if (severity === "critical") summary.critical += 1;
        else if (severity === "warning") summary.warnings += 1;
        else if (severity === "passed") summary.passed += 1;

        const uniqueKey = `${ref.id}_${categoryName}`;
        if (!seenIssueIds.has(uniqueKey)) {
          seenIssueIds.add(uniqueKey);
          issues.push({
            id: ref.id,
            title: audit.title || ref.id,
            description: stripMarkdownLinks(audit.description || ""),
            severity,
            category: categoryName,
            displayValue: audit.displayValue || null,
          });
        }
      }
    }

    const payload = {
      projectId: project.id,
      url: targetUrl,
      strategy,
      status: "completed",
      crawledAt: lighthouse.fetchTime || new Date().toISOString(),
      healthScore,
      summary,
      categories: categoriesOut,
      issues,
    };

    auditCache.set(cacheKey, { data: payload, timestamp: Date.now() });
    res.json(payload);
  } catch (err) {
    if (err.name === "TimeoutError" || err.message?.toLowerCase().includes("timeout")) {
      return res.status(504).json({
        error: "PageSpeed Insights crawl timed out after 60 seconds. The target website may be responding slowly. Please retry.",
      });
    }
    console.error("Project audit route error:", err);
    res.status(500).json({ error: "Audit request failed: " + err.message });
  }
});

export default router;
