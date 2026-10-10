import express from "express";
import { getDb } from "../config/db.js";
import { formatKeywordRow } from "./keywords.routes.js";

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

function formatCategoryRow(c) {
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    projectId: c.project_id || c.projectId,
    deletedAt: c.deleted_at || c.deletedAt || null,
    deletedWith: c.deleted_with || c.deletedWith || null,
  };
}

function formatBacklinkRow(b) {
  if (!b) return null;
  return {
    id: b.id,
    projectId: b.project_id || b.projectId || "site-1",
    websiteName: b.website_name || b.websiteName || "Web Source",
    websiteUrl: b.website_url || b.websiteUrl || "",
    submittedUrl: b.submitted_url || b.submittedUrl || "",
    type: b.type || "Directory",
    status: b.status || "Undone",
    anchorText: b.anchor_text || b.anchorText || "Brand Link",
    da: Number(b.da) || 0,
    deletedAt: b.deleted_at || b.deletedAt || null,
  };
}

// GET /api/data - Return all keywords, projects, categories, backlinks
router.get("/", async (req, res) => {
  try {
    const { client, type } = await getDb();

    let keywords = [];
    let projects = [];
    let categories = [];
    let backlinks = [];

    if (type === "postgres") {
      const kwRes = await client.query("SELECT * FROM keywords ORDER BY created_at DESC");
      keywords = kwRes.rows.map(formatKeywordRow);

      const prRes = await client.query("SELECT * FROM projects ORDER BY created_at ASC");
      projects = prRes.rows.map(formatProjectRow);

      const catRes = await client.query("SELECT * FROM categories ORDER BY created_at ASC");
      categories = catRes.rows.map(formatCategoryRow);

      const blRes = await client.query("SELECT * FROM backlinks ORDER BY created_at DESC");
      backlinks = blRes.rows.map(formatBacklinkRow);
    } else if (type === "mysql") {
      const [kwRes] = await client.query("SELECT * FROM keywords ORDER BY created_at DESC");
      keywords = kwRes.map(formatKeywordRow);

      const [prRes] = await client.query("SELECT * FROM projects ORDER BY created_at ASC");
      projects = prRes.map(formatProjectRow);

      const [catRes] = await client.query("SELECT * FROM categories ORDER BY created_at ASC");
      categories = catRes.map(formatCategoryRow);

      const [blRes] = await client.query("SELECT * FROM backlinks ORDER BY created_at DESC");
      backlinks = blRes.map(formatBacklinkRow);
    } else {
      keywords = client.prepare("SELECT * FROM keywords ORDER BY created_at DESC").all().map(formatKeywordRow);
      projects = client.prepare("SELECT * FROM projects ORDER BY created_at ASC").all().map(formatProjectRow);
      categories = client.prepare("SELECT * FROM categories ORDER BY created_at ASC").all().map(formatCategoryRow);
      backlinks = client.prepare("SELECT * FROM backlinks ORDER BY created_at DESC").all().map(formatBacklinkRow);
    }

    res.json({ keywords, projects, categories, backlinks });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch database data: " + err.message });
  }
});

// POST /api/data/sync - Sync full state from frontend
router.post("/sync", async (req, res) => {
  try {
    const { keywords = [], projects = [], categories = [], backlinks = [] } = req.body;
    const { client, type } = await getDb();

    if (type === "postgres") {
      const pgClient = await client.connect();
      try {
        await pgClient.query("BEGIN");
        for (const p of projects) {
          await pgClient.query(
            `INSERT INTO projects (id, name, domain, deleted_at, deleted_with)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              domain = EXCLUDED.domain,
              deleted_at = EXCLUDED.deleted_at,
              deleted_with = EXCLUDED.deleted_with`,
            [p.id, p.name, p.domain || "", p.deletedAt || null, p.deletedWith || null]
          );
        }

        for (const c of categories) {
          await pgClient.query(
            `INSERT INTO categories (id, name, project_id, deleted_at, deleted_with)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              project_id = EXCLUDED.project_id,
              deleted_at = EXCLUDED.deleted_at,
              deleted_with = EXCLUDED.deleted_with`,
            [c.id, c.name, c.projectId || "proj-1", c.deletedAt || null, c.deletedWith || null]
          );
        }

        for (const k of keywords) {
          const histJson = JSON.stringify(k.history || []);
          const monthJson = JSON.stringify(k.monthly || {});
          const serpJson = JSON.stringify(k.serpFeatures || []);
          const pos = k.position !== undefined && k.position !== null ? Number(k.position) : null;
          const prevPos = k.previousPosition !== undefined && k.previousPosition !== null ? Number(k.previousPosition) : null;
          const chg = k.change !== undefined ? Number(k.change) : 0;
          await pgClient.query(
            `INSERT INTO keywords (
              id, project_id, keyword, group_name, url, target_url, position, previous_position, change_val,
              volume, difficulty, cpc, device, location, search_engine, best_position, worst_position,
              serp_features, history, monthly, deleted_at, deleted_with
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
            )
            ON CONFLICT (id) DO UPDATE SET
              project_id = EXCLUDED.project_id,
              keyword = EXCLUDED.keyword,
              group_name = EXCLUDED.group_name,
              url = EXCLUDED.url,
              target_url = EXCLUDED.target_url,
              position = EXCLUDED.position,
              previous_position = EXCLUDED.previous_position,
              change_val = EXCLUDED.change_val,
              volume = EXCLUDED.volume,
              difficulty = EXCLUDED.difficulty,
              cpc = EXCLUDED.cpc,
              device = EXCLUDED.device,
              location = EXCLUDED.location,
              search_engine = EXCLUDED.search_engine,
              best_position = EXCLUDED.best_position,
              worst_position = EXCLUDED.worst_position,
              serp_features = EXCLUDED.serp_features,
              history = EXCLUDED.history,
              monthly = EXCLUDED.monthly,
              deleted_at = EXCLUDED.deleted_at,
              deleted_with = EXCLUDED.deleted_with`,
            [
              k.id,
              k.projectId || "p1",
              k.keyword,
              k.group || "General",
              k.url || "",
              k.targetUrl || k.url || "",
              pos,
              prevPos,
              chg,
              Number(k.volume) || 0,
              Number(k.difficulty) || 0,
              Number(k.cpc) || 2.5,
              k.device || "desktop",
              k.location || "United States",
              k.searchEngine || "Google",
              k.bestPosition || pos,
              k.worstPosition || pos,
              serpJson,
              histJson,
              monthJson,
              k.deletedAt || null,
              k.deletedWith || null,
            ]
          );
        }

        for (const b of backlinks) {
          await pgClient.query(
            `INSERT INTO backlinks (id, project_id, website_name, website_url, submitted_url, type, status, anchor_text, da, deleted_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO UPDATE SET
              project_id = EXCLUDED.project_id,
              website_name = EXCLUDED.website_name,
              website_url = EXCLUDED.website_url,
              submitted_url = EXCLUDED.submitted_url,
              type = EXCLUDED.type,
              status = EXCLUDED.status,
              anchor_text = EXCLUDED.anchor_text,
              da = EXCLUDED.da,
              deleted_at = EXCLUDED.deleted_at`,
            [
              b.id,
              b.projectId || "site-1",
              b.websiteName || "Web Source",
              b.websiteUrl,
              b.submittedUrl || "",
              b.type || "Directory",
              b.status || "Undone",
              b.anchorText || "Brand Link",
              Number(b.da) || 0,
              b.deletedAt || null,
            ]
          );
        }

        await pgClient.query("COMMIT");
      } catch (e) {
        await pgClient.query("ROLLBACK");
        throw e;
      } finally {
        pgClient.release();
      }
    } else if (type === "mysql") {
      const conn = await client.getConnection();
      try {
        await conn.beginTransaction();
        for (const p of projects) {
          await conn.query(
            `INSERT INTO projects (id, name, domain, deleted_at, deleted_with)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              domain = VALUES(domain),
              deleted_at = VALUES(deleted_at),
              deleted_with = VALUES(deleted_with)`,
            [p.id, p.name, p.domain || "", p.deletedAt || null, p.deletedWith || null]
          );
        }

        for (const c of categories) {
          await conn.query(
            `INSERT INTO categories (id, name, project_id, deleted_at, deleted_with)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              project_id = VALUES(project_id),
              deleted_at = VALUES(deleted_at),
              deleted_with = VALUES(deleted_with)`,
            [c.id, c.name, c.projectId || "p1", c.deletedAt || null, c.deletedWith || null]
          );
        }

        for (const k of keywords) {
          const histJson = JSON.stringify(k.history || []);
          const monthJson = JSON.stringify(k.monthly || {});
          const serpJson = JSON.stringify(k.serpFeatures || []);
          const pos = k.position !== undefined && k.position !== null ? Number(k.position) : null;
          const prevPos = k.previousPosition !== undefined && k.previousPosition !== null ? Number(k.previousPosition) : null;
          const chg = k.change !== undefined ? Number(k.change) : 0;
          await conn.query(
            `INSERT INTO keywords (
              id, project_id, keyword, group_name, url, target_url, position, previous_position, change_val,
              volume, difficulty, cpc, device, location, search_engine, best_position, worst_position,
              serp_features, history, monthly, deleted_at, deleted_with
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            ON DUPLICATE KEY UPDATE
              project_id = VALUES(project_id),
              keyword = VALUES(keyword),
              group_name = VALUES(group_name),
              url = VALUES(url),
              target_url = VALUES(target_url),
              position = VALUES(position),
              previous_position = VALUES(previous_position),
              change_val = VALUES(change_val),
              volume = VALUES(volume),
              difficulty = VALUES(difficulty),
              cpc = VALUES(cpc),
              device = VALUES(device),
              location = VALUES(location),
              search_engine = VALUES(search_engine),
              best_position = VALUES(best_position),
              worst_position = VALUES(worst_position),
              serp_features = VALUES(serp_features),
              history = VALUES(history),
              monthly = VALUES(monthly),
              deleted_at = VALUES(deleted_at),
              deleted_with = VALUES(deleted_with)`,
            [
              k.id,
              k.projectId || "p1",
              k.keyword,
              k.group || "General",
              k.url || "",
              k.targetUrl || k.url || "",
              pos,
              prevPos,
              chg,
              Number(k.volume) || 0,
              Number(k.difficulty) || 0,
              Number(k.cpc) || 2.5,
              k.device || "desktop",
              k.location || "United States",
              k.searchEngine || "Google",
              k.bestPosition || pos,
              k.worstPosition || pos,
              serpJson,
              histJson,
              monthJson,
              k.deletedAt || null,
              k.deletedWith || null,
            ]
          );
        }

        for (const b of backlinks) {
          await conn.query(
            `INSERT INTO backlinks (id, project_id, website_name, website_url, submitted_url, type, status, anchor_text, da, deleted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
              project_id = VALUES(project_id),
              website_name = VALUES(website_name),
              website_url = VALUES(website_url),
              submitted_url = VALUES(submitted_url),
              type = VALUES(type),
              status = VALUES(status),
              anchor_text = VALUES(anchor_text),
              da = VALUES(da),
              deleted_at = VALUES(deleted_at)`,
            [
              b.id,
              b.projectId || "site-1",
              b.websiteName || "Web Source",
              b.websiteUrl,
              b.submittedUrl || "",
              b.type || "Directory",
              b.status || "Undone",
              b.anchorText || "Brand Link",
              Number(b.da) || 0,
              b.deletedAt || null,
            ]
          );
        }

        await conn.commit();
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
    } else {
      const syncTx = client.transaction(() => {
        const insProj = client.prepare(
          `INSERT INTO projects (id, name, domain, deleted_at, deleted_with)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET
            name = excluded.name,
            domain = excluded.domain,
            deleted_at = excluded.deleted_at,
            deleted_with = excluded.deleted_with`
        );
        for (const p of projects) {
          insProj.run(p.id, p.name, p.domain || "", p.deletedAt || null, p.deletedWith || null);
        }

        const insCat = client.prepare(
          `INSERT INTO categories (id, name, project_id, deleted_at, deleted_with)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET
            name = excluded.name,
            project_id = excluded.project_id,
            deleted_at = excluded.deleted_at,
            deleted_with = excluded.deleted_with`
        );
        for (const c of categories) {
          insCat.run(c.id, c.name, c.projectId || "proj-1", c.deletedAt || null, c.deletedWith || null);
        }

        const insKw = client.prepare(
          `INSERT INTO keywords (
            id, project_id, keyword, group_name, url, target_url, position, previous_position, change_val,
            volume, difficulty, cpc, device, location, search_engine, best_position, worst_position,
            serp_features, history, monthly, deleted_at, deleted_with
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
          ON CONFLICT (id) DO UPDATE SET
            project_id = excluded.project_id,
            keyword = excluded.keyword,
            group_name = excluded.group_name,
            url = excluded.url,
            target_url = excluded.target_url,
            position = excluded.position,
            previous_position = excluded.previous_position,
            change_val = excluded.change_val,
            volume = excluded.volume,
            difficulty = excluded.difficulty,
            cpc = excluded.cpc,
            device = excluded.device,
            location = excluded.location,
            search_engine = excluded.search_engine,
            best_position = excluded.best_position,
            worst_position = excluded.worst_position,
            serp_features = excluded.serp_features,
            history = excluded.history,
            monthly = excluded.monthly,
            deleted_at = excluded.deleted_at,
            deleted_with = excluded.deleted_with`
        );
        for (const k of keywords) {
          const histJson = JSON.stringify(k.history || []);
          const monthJson = JSON.stringify(k.monthly || {});
          const serpJson = JSON.stringify(k.serpFeatures || []);
          const pos = k.position !== undefined && k.position !== null ? Number(k.position) : null;
          const prevPos = k.previousPosition !== undefined && k.previousPosition !== null ? Number(k.previousPosition) : null;
          const chg = k.change !== undefined ? Number(k.change) : 0;
          insKw.run(
            k.id,
            k.projectId || "p1",
            k.keyword,
            k.group || "General",
            k.url || "",
            k.targetUrl || k.url || "",
            pos,
            prevPos,
            chg,
            Number(k.volume) || 0,
            Number(k.difficulty) || 0,
            Number(k.cpc) || 2.5,
            k.device || "desktop",
            k.location || "United States",
            k.searchEngine || "Google",
            k.bestPosition || pos,
            k.worstPosition || pos,
            serpJson,
            histJson,
            monthJson,
            k.deletedAt || null,
            k.deletedWith || null
          );
        }

        const insBl = client.prepare(
          `INSERT INTO backlinks (id, project_id, website_name, website_url, submitted_url, type, status, anchor_text, da, deleted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET
            project_id = excluded.project_id,
            website_name = excluded.website_name,
            website_url = excluded.website_url,
            submitted_url = excluded.submitted_url,
            type = excluded.type,
            status = excluded.status,
            anchor_text = excluded.anchor_text,
            da = excluded.da,
            deleted_at = excluded.deleted_at`
        );
        for (const b of backlinks) {
          insBl.run(
            b.id,
            b.projectId || "site-1",
            b.websiteName || "Web Source",
            b.websiteUrl,
            b.submittedUrl || "",
            b.type || "Directory",
            b.status || "Undone",
            b.anchorText || "Brand Link",
            Number(b.da) || 0,
            b.deletedAt || null
          );
        }
      });
      syncTx();
    }

    res.json({
      success: true,
      synced: {
        keywords: keywords.length,
        projects: projects.length,
        categories: categories.length,
        backlinks: backlinks.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Sync failed: " + err.message });
  }
});

export default router;
