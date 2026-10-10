import express from "express";
import { getDb } from "../config/db.js";

const router = express.Router();

function toSqlDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export function formatKeywordRow(k) {
  if (!k) return null;
  const history = typeof k.history === "string" ? JSON.parse(k.history || "[]") : k.history || [];
  const monthly = typeof k.monthly === "string" ? JSON.parse(k.monthly || "{}") : k.monthly || {};

  // Extract or compute position
  let pos = k.position !== undefined && k.position !== null ? Number(k.position) : null;
  if (pos === null || isNaN(pos)) {
    if (monthly["2026-10"] !== undefined && monthly["2026-10"] !== null && !isNaN(Number(monthly["2026-10"]))) {
      pos = Number(monthly["2026-10"]);
    } else if (Array.isArray(history) && history.length > 0) {
      pos = Number(history[history.length - 1]);
    }
  }

  // Extract or compute previous position
  let prevPos = k.previous_position !== undefined && k.previous_position !== null ? Number(k.previous_position) : null;
  if (prevPos === null || isNaN(prevPos)) {
    if (monthly["2026-09"] !== undefined && monthly["2026-09"] !== null && !isNaN(Number(monthly["2026-09"]))) {
      prevPos = Number(monthly["2026-09"]);
    }
  }

  // Calculate change
  let change = Number(k.change_val || k.change || 0);
  if (prevPos !== null && pos !== null) {
    change = prevPos - pos;
  }

  const mEntries = Object.values(monthly).map(Number).filter((n) => !isNaN(n) && n > 0);
  const bestPos = k.best_position !== undefined && k.best_position !== null
    ? Number(k.best_position)
    : (mEntries.length > 0 ? Math.min(...mEntries) : pos);
  const worstPos = k.worst_position !== undefined && k.worst_position !== null
    ? Number(k.worst_position)
    : (mEntries.length > 0 ? Math.max(...mEntries) : pos);

  const serpFeatures = typeof k.serp_features === "string"
    ? JSON.parse(k.serp_features || "[]")
    : k.serp_features || ["Featured Snippet", "People Also Ask"];

  const targetUrl = k.target_url || k.url || "";
  const url = k.url || k.target_url || "";

  return {
    id: k.id,
    projectId: k.project_id || k.projectId || "p1",
    websiteId: k.website_id || k.websiteId || k.project_id || k.projectId || "site-1",
    keyword: k.keyword,
    group: k.group_name || k.group || "General",
    position: pos,
    previousPosition: prevPos,
    change,
    volume: Number(k.volume) || 0,
    difficulty: Number(k.difficulty) || 0,
    cpc: Number(k.cpc) || 2.5,
    url,
    targetUrl,
    device: k.device || "desktop",
    location: k.location || "United States",
    searchEngine: k.search_engine || k.searchEngine || "Google",
    serpFeatures,
    bestPosition: bestPos,
    worstPosition: worstPos,
    history,
    history30d: history,
    monthly,
    monthlyPositions: monthly,
    trackingStartDate: k.tracking_start_date ? String(k.tracking_start_date).split("T")[0] : null,
    lastUpdated: k.last_updated ? String(k.last_updated).split("T")[0] : null,
    createdAt: k.created_at || null,
    deletedAt: k.deleted_at || k.deletedAt || null,
    deletedWith: k.deleted_with || k.deletedWith || null,
  };
}

// GET /api/keywords
router.get("/", async (req, res) => {
  try {
    const { projectId } = req.query;
    const { client, type } = await getDb();
    let rows = [];

    if (projectId) {
      if (type === "postgres") {
        const r = await client.query("SELECT * FROM keywords WHERE project_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC", [projectId]);
        rows = r.rows;
      } else if (type === "mysql") {
        const [r] = await client.query("SELECT * FROM keywords WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at DESC", [projectId]);
        rows = r;
      } else {
        rows = client.prepare("SELECT * FROM keywords WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at DESC").all(projectId);
      }
    } else {
      if (type === "postgres") {
        const r = await client.query("SELECT * FROM keywords WHERE deleted_at IS NULL ORDER BY created_at DESC");
        rows = r.rows;
      } else if (type === "mysql") {
        const [r] = await client.query("SELECT * FROM keywords WHERE deleted_at IS NULL ORDER BY created_at DESC");
        rows = r;
      } else {
        rows = client.prepare("SELECT * FROM keywords WHERE deleted_at IS NULL ORDER BY created_at DESC").all();
      }
    }

    res.json(rows.map(formatKeywordRow));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch keywords: " + err.message });
  }
});

// POST /api/keywords
router.post("/", async (req, res) => {
  try {
    const {
      id,
      projectId,
      keyword,
      group,
      url,
      targetUrl,
      position,
      previousPosition,
      change,
      volume,
      difficulty,
      cpc,
      device,
      location,
      searchEngine,
      bestPosition,
      worstPosition,
      serpFeatures,
      history,
      monthly,
      trackingStartDate,
      lastUpdated,
    } = req.body;

    if (!keyword) return res.status(400).json({ error: "Keyword is required." });

    const keyId = id || "kw-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const pId = projectId || "p1";
    const grp = group || "General";
    const u = url || targetUrl || "";
    const tu = targetUrl || url || "";
    const pos = position !== undefined && position !== null ? Number(position) : null;
    const prevPos = previousPosition !== undefined && previousPosition !== null ? Number(previousPosition) : null;
    const chg = change !== undefined ? Number(change) : (prevPos !== null && pos !== null ? prevPos - pos : 0);
    const vol = Number(volume) || 0;
    const diff = Number(difficulty) || 0;
    const cpcVal = Number(cpc) || 2.5;
    const dev = device || "desktop";
    const loc = location || "United States";
    const se = searchEngine || "Google";
    const bestP = bestPosition !== undefined && bestPosition !== null ? Number(bestPosition) : pos;
    const worstP = worstPosition !== undefined && worstPosition !== null ? Number(worstPosition) : pos;
    const serpJson = JSON.stringify(serpFeatures || ["Featured Snippet", "People Also Ask"]);
    const histJson = JSON.stringify(history || (pos ? [pos] : []));
    const monthJson = JSON.stringify(monthly || (pos ? { "2026-10": pos } : {}));
    const trackStart = toSqlDate(trackingStartDate) || new Date();
    const lastUp = toSqlDate(lastUpdated) || new Date();

    const { client, type } = await getDb();

    if (type === "postgres") {
      const r = await client.query(
        `INSERT INTO keywords (
          id, project_id, keyword, group_name, url, target_url, position, previous_position, change_val,
          volume, difficulty, cpc, device, location, search_engine, best_position, worst_position,
          serp_features, history, monthly, tracking_start_date, last_updated
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        ) RETURNING *`,
        [
          keyId, pId, keyword, grp, u, tu, pos, prevPos, chg,
          vol, diff, cpcVal, dev, loc, se, bestP, worstP,
          serpJson, histJson, monthJson, trackStart, lastUp
        ]
      );
      return res.status(201).json(formatKeywordRow(r.rows[0]));
    } else if (type === "mysql") {
      await client.query(
        `INSERT INTO keywords (
          id, project_id, keyword, group_name, url, target_url, position, previous_position, change_val,
          volume, difficulty, cpc, device, location, search_engine, best_position, worst_position,
          serp_features, history, monthly, tracking_start_date, last_updated
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`,
        [
          keyId, pId, keyword, grp, u, tu, pos, prevPos, chg,
          vol, diff, cpcVal, dev, loc, se, bestP, worstP,
          serpJson, histJson, monthJson, trackStart, lastUp
        ]
      );
      const [r] = await client.query("SELECT * FROM keywords WHERE id = ?", [keyId]);
      return res.status(201).json(formatKeywordRow(r[0]));
    } else {
      client
        .prepare(
          `INSERT INTO keywords (
            id, project_id, keyword, group_name, url, target_url, position, previous_position, change_val,
            volume, difficulty, cpc, device, location, search_engine, best_position, worst_position,
            serp_features, history, monthly, tracking_start_date, last_updated
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )`
        )
        .run(
          keyId, pId, keyword, grp, u, tu, pos, prevPos, chg,
          vol, diff, cpcVal, dev, loc, se, bestP, worstP,
          serpJson, histJson, monthJson, trackStart ? trackStart.toISOString() : null, lastUp ? lastUp.toISOString() : null
        );
      const r = client.prepare("SELECT * FROM keywords WHERE id = ?").get(keyId);
      return res.status(201).json(formatKeywordRow(r));
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to create keyword: " + err.message });
  }
});

// PUT / PATCH /api/keywords/:id
const updateKeywordHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      keyword,
      group,
      url,
      targetUrl,
      position,
      previousPosition,
      change,
      volume,
      difficulty,
      cpc,
      device,
      location,
      searchEngine,
      bestPosition,
      worstPosition,
      serpFeatures,
      history,
      monthly,
      trackingStartDate,
      lastUpdated,
      deletedAt,
      deletedWith,
    } = req.body;

    const { client, type } = await getDb();

    const histJson = history !== undefined ? JSON.stringify(history) : null;
    const monthJson = monthly !== undefined ? JSON.stringify(monthly) : null;
    const serpJson = serpFeatures !== undefined ? JSON.stringify(serpFeatures) : null;
    const parsedDeletedAt = toSqlDate(deletedAt);
    const parsedTrackStart = toSqlDate(trackingStartDate);
    const parsedLastUp = toSqlDate(lastUpdated);

    if (type === "postgres") {
      const r = await client.query(
        `UPDATE keywords SET
          keyword = COALESCE($1, keyword),
          group_name = COALESCE($2, group_name),
          url = COALESCE($3, url),
          target_url = COALESCE($4, target_url),
          position = COALESCE($5, position),
          previous_position = COALESCE($6, previous_position),
          change_val = COALESCE($7, change_val),
          volume = COALESCE($8, volume),
          difficulty = COALESCE($9, difficulty),
          cpc = COALESCE($10, cpc),
          device = COALESCE($11, device),
          location = COALESCE($12, location),
          search_engine = COALESCE($13, search_engine),
          best_position = COALESCE($14, best_position),
          worst_position = COALESCE($15, worst_position),
          serp_features = CASE WHEN $16::jsonb IS NOT NULL THEN $16::jsonb ELSE serp_features END,
          history = CASE WHEN $17::jsonb IS NOT NULL THEN $17::jsonb ELSE history END,
          monthly = CASE WHEN $18::jsonb IS NOT NULL THEN $18::jsonb ELSE monthly END,
          tracking_start_date = COALESCE($19, tracking_start_date),
          last_updated = COALESCE($20, last_updated),
          deleted_at = $21,
          deleted_with = $22
        WHERE id = $23 RETURNING *`,
        [
          keyword, group, url, targetUrl, position, previousPosition, change,
          volume, difficulty, cpc, device, location, searchEngine, bestPosition, worstPosition,
          serpJson, histJson, monthJson, parsedTrackStart, parsedLastUp, parsedDeletedAt, deletedWith || null, id
        ]
      );
      return res.json(formatKeywordRow(r.rows[0]));
    } else if (type === "mysql") {
      await client.query(
        `UPDATE keywords SET
          keyword = COALESCE(?, keyword),
          group_name = COALESCE(?, group_name),
          url = COALESCE(?, url),
          target_url = COALESCE(?, target_url),
          position = COALESCE(?, position),
          previous_position = COALESCE(?, previous_position),
          change_val = COALESCE(?, change_val),
          volume = COALESCE(?, volume),
          difficulty = COALESCE(?, difficulty),
          cpc = COALESCE(?, cpc),
          device = COALESCE(?, device),
          location = COALESCE(?, location),
          search_engine = COALESCE(?, search_engine),
          best_position = COALESCE(?, best_position),
          worst_position = COALESCE(?, worst_position),
          serp_features = COALESCE(?, serp_features),
          history = COALESCE(?, history),
          monthly = COALESCE(?, monthly),
          tracking_start_date = COALESCE(?, tracking_start_date),
          last_updated = COALESCE(?, last_updated),
          deleted_at = ?,
          deleted_with = ?
        WHERE id = ?`,
        [
          keyword, group, url, targetUrl, position, previousPosition, change,
          volume, difficulty, cpc, device, location, searchEngine, bestPosition, worstPosition,
          serpJson, histJson, monthJson, parsedTrackStart, parsedLastUp, parsedDeletedAt, deletedWith || null, id
        ]
      );
      const [r] = await client.query("SELECT * FROM keywords WHERE id = ?", [id]);
      return res.json(formatKeywordRow(r[0]));
    } else {
      client
        .prepare(
          `UPDATE keywords SET
            keyword = COALESCE(?, keyword),
            group_name = COALESCE(?, group_name),
            url = COALESCE(?, url),
            target_url = COALESCE(?, target_url),
            position = COALESCE(?, position),
            previous_position = COALESCE(?, previous_position),
            change_val = COALESCE(?, change_val),
            volume = COALESCE(?, volume),
            difficulty = COALESCE(?, difficulty),
            cpc = COALESCE(?, cpc),
            device = COALESCE(?, device),
            location = COALESCE(?, location),
            search_engine = COALESCE(?, search_engine),
            best_position = COALESCE(?, best_position),
            worst_position = COALESCE(?, worst_position),
            serp_features = COALESCE(?, serp_features),
            history = COALESCE(?, history),
            monthly = COALESCE(?, monthly),
            tracking_start_date = COALESCE(?, tracking_start_date),
            last_updated = COALESCE(?, last_updated),
            deleted_at = ?,
            deleted_with = ?
          WHERE id = ?`
        )
        .run(
          keyword, group, url, targetUrl, position, previousPosition, change,
          volume, difficulty, cpc, device, location, searchEngine, bestPosition, worstPosition,
          serpJson, histJson, monthJson, parsedTrackStart ? parsedTrackStart.toISOString() : null, parsedLastUp ? parsedLastUp.toISOString() : null,
          parsedDeletedAt ? parsedDeletedAt.toISOString() : null, deletedWith || null, id
        );
      const r = client.prepare("SELECT * FROM keywords WHERE id = ?").get(id);
      return res.json(formatKeywordRow(r));
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update keyword: " + err.message });
  }
};

router.put("/:id", updateKeywordHandler);
router.patch("/:id", updateKeywordHandler);

// DELETE /api/keywords/:id (Hard delete by default)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { soft } = req.query;
    const { client, type } = await getDb();

    if (soft === "true") {
      const now = new Date();
      if (type === "postgres") {
        await client.query("UPDATE keywords SET deleted_at = $1 WHERE id = $2", [now, id]);
      } else if (type === "mysql") {
        await client.query("UPDATE keywords SET deleted_at = ? WHERE id = ?", [now, id]);
      } else {
        client.prepare("UPDATE keywords SET deleted_at = ? WHERE id = ?").run(now.toISOString(), id);
      }
      return res.json({ success: true, message: "Keyword moved to trash" });
    }

    if (type === "postgres") {
      await client.query("DELETE FROM keywords WHERE id = $1", [id]);
    } else if (type === "mysql") {
      await client.query("DELETE FROM keywords WHERE id = ?", [id]);
    } else {
      client.prepare("DELETE FROM keywords WHERE id = ?").run(id);
    }
    return res.json({ success: true, message: "Keyword permanently deleted from database" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete keyword: " + err.message });
  }
});

export default router;
