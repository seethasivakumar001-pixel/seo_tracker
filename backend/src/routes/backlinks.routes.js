import express from "express";
import { getDb } from "../config/db.js";

const router = express.Router();

function toSqlDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function formatBacklinkRow(b) {
  if (!b) return null;
  return {
    id: b.id,
    projectId: b.project_id || b.projectId || "site-1",
    websiteName: b.website_name || b.websiteName || "Web Link",
    websiteUrl: b.website_url || b.websiteUrl || "",
    submittedUrl: b.submitted_url || b.submittedUrl || "",
    type: b.type || "Directory",
    status: b.status || "Undone",
    anchorText: b.anchor_text || b.anchorText || "",
    linkAttribute: b.link_attribute || b.linkAttribute || "Dofollow",
    domainRating: Number(b.domain_rating || b.domainRating || b.da || 50),
    spamScore: Number(b.spam_score || b.spamScore || 1),
    trafficEstimate: b.traffic_estimate || b.trafficEstimate || "1.2M",
    verificationStatus: b.verification_status || b.verificationStatus || "Pending",
    notes: b.notes || "",
    dateSubmitted: b.date_submitted || b.dateSubmitted || null,
    dateVerified: b.date_verified || b.dateVerified || null,
    lastChecked: b.last_checked || b.lastChecked || null,
    da: Number(b.da || b.domain_rating || b.domainRating || 50),
    deletedAt: b.deleted_at || b.deletedAt || null,
    createdAt: b.created_at || b.createdAt || new Date().toISOString()
  };
}

// GET /api/backlinks
router.get("/", async (req, res) => {
  try {
    const { projectId } = req.query;
    const { client, type } = await getDb();
    let rows = [];

    if (projectId) {
      if (type === "postgres") {
        const r = await client.query(
          "SELECT * FROM backlinks WHERE project_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC",
          [projectId]
        );
        rows = r.rows;
      } else if (type === "mysql") {
        const [r] = await client.query(
          "SELECT * FROM backlinks WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at DESC",
          [projectId]
        );
        rows = r;
      } else {
        rows = client.prepare("SELECT * FROM backlinks WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at DESC").all(projectId);
      }
    } else {
      if (type === "postgres") {
        const r = await client.query("SELECT * FROM backlinks WHERE deleted_at IS NULL ORDER BY created_at DESC");
        rows = r.rows;
      } else if (type === "mysql") {
        const [r] = await client.query("SELECT * FROM backlinks WHERE deleted_at IS NULL ORDER BY created_at DESC");
        rows = r;
      } else {
        rows = client.prepare("SELECT * FROM backlinks WHERE deleted_at IS NULL ORDER BY created_at DESC").all();
      }
    }

    res.json(rows.map(formatBacklinkRow));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch backlinks: " + err.message });
  }
});

// POST /api/backlinks
router.post("/", async (req, res) => {
  try {
    const {
      id,
      projectId,
      websiteName,
      websiteUrl,
      submittedUrl,
      type: bType,
      status,
      anchorText,
      linkAttribute,
      domainRating,
      spamScore,
      trafficEstimate,
      verificationStatus,
      notes,
      dateSubmitted,
      dateVerified,
      lastChecked,
      da
    } = req.body;

    if (!websiteUrl) {
      return res.status(400).json({ error: "Website URL is required." });
    }

    const blId = id || "bl-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const pId = projectId || "site-1";
    const name = websiteName || "Web Link";
    const webUrl = websiteUrl.trim();
    const subUrl = submittedUrl ? submittedUrl.trim() : "";
    const btype = bType || "Directory";
    const st = status || "Undone";
    const anchor = anchorText || "";
    const attr = linkAttribute || "Dofollow";
    const dr = Number(domainRating || da || 50);
    const spam = Number(spamScore || 1);
    const traffic = trafficEstimate || "1.2M";
    const verif = verificationStatus || (st === "Done" ? "Live" : "Pending");
    const note = notes || "";
    const dtSub = toSqlDate(dateSubmitted);
    const dtVer = toSqlDate(dateVerified);
    const dtChk = toSqlDate(lastChecked);

    const { client, type } = await getDb();

    if (type === "postgres") {
      const r = await client.query(
        `INSERT INTO backlinks (
          id, project_id, website_name, website_url, submitted_url,
          type, status, anchor_text, link_attribute, domain_rating,
          spam_score, traffic_estimate, verification_status, notes,
          date_submitted, date_verified, last_checked, da
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING *`,
        [blId, pId, name, webUrl, subUrl, btype, st, anchor, attr, dr, spam, traffic, verif, note, dtSub, dtVer, dtChk, dr]
      );
      return res.status(201).json(formatBacklinkRow(r.rows[0]));
    } else if (type === "mysql") {
      await client.query(
        `INSERT INTO backlinks (
          id, project_id, website_name, website_url, submitted_url,
          type, status, anchor_text, link_attribute, domain_rating,
          spam_score, traffic_estimate, verification_status, notes,
          date_submitted, date_verified, last_checked, da
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        ON DUPLICATE KEY UPDATE
          project_id = VALUES(project_id),
          website_name = VALUES(website_name),
          website_url = VALUES(website_url),
          submitted_url = VALUES(submitted_url),
          type = VALUES(type),
          status = VALUES(status),
          anchor_text = VALUES(anchor_text),
          link_attribute = VALUES(link_attribute),
          domain_rating = VALUES(domain_rating),
          spam_score = VALUES(spam_score),
          traffic_estimate = VALUES(traffic_estimate),
          verification_status = VALUES(verification_status),
          notes = VALUES(notes),
          date_submitted = VALUES(date_submitted),
          date_verified = VALUES(date_verified),
          last_checked = VALUES(last_checked),
          da = VALUES(da)`,
        [blId, pId, name, webUrl, subUrl, btype, st, anchor, attr, dr, spam, traffic, verif, note, dtSub, dtVer, dtChk, dr]
      );
      const [r] = await client.query("SELECT * FROM backlinks WHERE id = ?", [blId]);
      return res.status(201).json(formatBacklinkRow(r[0]));
    } else {
      client
        .prepare(
          `INSERT INTO backlinks (
            id, project_id, website_name, website_url, submitted_url,
            type, status, anchor_text, link_attribute, domain_rating,
            spam_score, traffic_estimate, verification_status, notes,
            date_submitted, date_verified, last_checked, da
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            project_id = excluded.project_id,
            website_name = excluded.website_name,
            website_url = excluded.website_url,
            submitted_url = excluded.submitted_url,
            type = excluded.type,
            status = excluded.status,
            anchor_text = excluded.anchor_text,
            link_attribute = excluded.link_attribute,
            domain_rating = excluded.domain_rating,
            spam_score = excluded.spam_score,
            traffic_estimate = excluded.traffic_estimate,
            verification_status = excluded.verification_status,
            notes = excluded.notes,
            date_submitted = excluded.date_submitted,
            date_verified = excluded.date_verified,
            last_checked = excluded.last_checked,
            da = excluded.da`
        )
        .run(blId, pId, name, webUrl, subUrl, btype, st, anchor, attr, dr, spam, traffic, verif, note, dtSub ? dtSub.toISOString() : null, dtVer ? dtVer.toISOString() : null, dtChk ? dtChk.toISOString() : null, dr);
      const r = client.prepare("SELECT * FROM backlinks WHERE id = ?").get(blId);
      return res.status(201).json(formatBacklinkRow(r));
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to create backlink: " + err.message });
  }
});

// PUT / PATCH /api/backlinks/:id
const updateBacklinkHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      websiteName,
      websiteUrl,
      submittedUrl,
      type: bType,
      status,
      anchorText,
      linkAttribute,
      domainRating,
      spamScore,
      trafficEstimate,
      verificationStatus,
      notes,
      dateSubmitted,
      dateVerified,
      lastChecked,
      da,
      deletedAt
    } = req.body;

    const { client, type } = await getDb();
    const parsedDeletedAt = toSqlDate(deletedAt);
    const parsedSub = toSqlDate(dateSubmitted);
    const parsedVer = toSqlDate(dateVerified);
    const parsedChk = toSqlDate(lastChecked);

    if (type === "postgres") {
      const r = await client.query(
        `UPDATE backlinks SET
          website_name = COALESCE($1, website_name),
          website_url = COALESCE($2, website_url),
          submitted_url = COALESCE($3, submitted_url),
          type = COALESCE($4, type),
          status = COALESCE($5, status),
          anchor_text = COALESCE($6, anchor_text),
          link_attribute = COALESCE($7, link_attribute),
          domain_rating = COALESCE($8, domain_rating),
          spam_score = COALESCE($9, spam_score),
          traffic_estimate = COALESCE($10, traffic_estimate),
          verification_status = COALESCE($11, verification_status),
          notes = COALESCE($12, notes),
          date_submitted = COALESCE($13, date_submitted),
          date_verified = COALESCE($14, date_verified),
          last_checked = COALESCE($15, last_checked),
          da = COALESCE($16, da),
          deleted_at = $17
        WHERE id = $18 RETURNING *`,
        [
          websiteName,
          websiteUrl,
          submittedUrl,
          bType,
          status,
          anchorText,
          linkAttribute,
          domainRating,
          spamScore,
          trafficEstimate,
          verificationStatus,
          notes,
          parsedSub,
          parsedVer,
          parsedChk,
          da || domainRating,
          parsedDeletedAt,
          id
        ]
      );
      return res.json(formatBacklinkRow(r.rows[0]));
    } else if (type === "mysql") {
      await client.query(
        `UPDATE backlinks SET
          website_name = COALESCE(?, website_name),
          website_url = COALESCE(?, website_url),
          submitted_url = COALESCE(?, submitted_url),
          type = COALESCE(?, type),
          status = COALESCE(?, status),
          anchor_text = COALESCE(?, anchor_text),
          link_attribute = COALESCE(?, link_attribute),
          domain_rating = COALESCE(?, domain_rating),
          spam_score = COALESCE(?, spam_score),
          traffic_estimate = COALESCE(?, traffic_estimate),
          verification_status = COALESCE(?, verification_status),
          notes = COALESCE(?, notes),
          date_submitted = COALESCE(?, date_submitted),
          date_verified = COALESCE(?, date_verified),
          last_checked = COALESCE(?, last_checked),
          da = COALESCE(?, da),
          deleted_at = ?
        WHERE id = ?`,
        [
          websiteName,
          websiteUrl,
          submittedUrl,
          bType,
          status,
          anchorText,
          linkAttribute,
          domainRating,
          spamScore,
          trafficEstimate,
          verificationStatus,
          notes,
          parsedSub,
          parsedVer,
          parsedChk,
          da || domainRating,
          parsedDeletedAt,
          id
        ]
      );
      const [r] = await client.query("SELECT * FROM backlinks WHERE id = ?", [id]);
      return res.json(formatBacklinkRow(r[0]));
    } else {
      client
        .prepare(
          `UPDATE backlinks SET
            website_name = COALESCE(?, website_name),
            website_url = COALESCE(?, website_url),
            submitted_url = COALESCE(?, submitted_url),
            type = COALESCE(?, type),
            status = COALESCE(?, status),
            anchor_text = COALESCE(?, anchor_text),
            link_attribute = COALESCE(?, link_attribute),
            domain_rating = COALESCE(?, domain_rating),
            spam_score = COALESCE(?, spam_score),
            traffic_estimate = COALESCE(?, traffic_estimate),
            verification_status = COALESCE(?, verification_status),
            notes = COALESCE(?, notes),
            date_submitted = COALESCE(?, date_submitted),
            date_verified = COALESCE(?, date_verified),
            last_checked = COALESCE(?, last_checked),
            da = COALESCE(?, da),
            deleted_at = ?
          WHERE id = ?`
        )
        .run(
          websiteName,
          websiteUrl,
          submittedUrl,
          bType,
          status,
          anchorText,
          linkAttribute,
          domainRating,
          spamScore,
          trafficEstimate,
          verificationStatus,
          notes,
          parsedSub ? parsedSub.toISOString() : null,
          parsedVer ? parsedVer.toISOString() : null,
          parsedChk ? parsedChk.toISOString() : null,
          da || domainRating,
          parsedDeletedAt ? parsedDeletedAt.toISOString() : null,
          id
        );
      const r = client.prepare("SELECT * FROM backlinks WHERE id = ?").get(id);
      return res.json(formatBacklinkRow(r));
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update backlink: " + err.message });
  }
};

router.put("/:id", updateBacklinkHandler);
router.patch("/:id", updateBacklinkHandler);

// DELETE /api/backlinks/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { soft } = req.query;
    const { client, type } = await getDb();

    if (soft === "true") {
      const now = new Date();
      if (type === "postgres") {
        await client.query("UPDATE backlinks SET deleted_at = $1 WHERE id = $2", [now, id]);
      } else if (type === "mysql") {
        await client.query("UPDATE backlinks SET deleted_at = ? WHERE id = ?", [now, id]);
      } else {
        client.prepare("UPDATE backlinks SET deleted_at = ? WHERE id = ?").run(now.toISOString(), id);
      }
      return res.json({ success: true, message: "Backlink moved to trash" });
    }

    if (type === "postgres") {
      await client.query("DELETE FROM backlinks WHERE id = $1", [id]);
    } else if (type === "mysql") {
      await client.query("DELETE FROM backlinks WHERE id = ?", [id]);
    } else {
      client.prepare("DELETE FROM backlinks WHERE id = ?").run(id);
    }
    return res.json({ success: true, message: "Backlink permanently deleted from database" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete backlink: " + err.message });
  }
});

// POST /api/backlinks/bulk
router.post("/bulk", async (req, res) => {
  try {
    const { backlinks = [] } = req.body;
    const { client, type } = await getDb();

    for (const b of backlinks) {
      const blId = b.id || "bl-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const pId = b.projectId || "site-1";
      const name = b.websiteName || "Web Link";
      const webUrl = (b.websiteUrl || "").trim();
      const subUrl = (b.submittedUrl || "").trim();
      const btype = b.type || "Directory";
      const st = b.status || "Undone";
      const anchor = b.anchorText || "";
      const attr = b.linkAttribute || "Dofollow";
      const dr = Number(b.domainRating || b.da || 50);
      const spam = Number(b.spamScore || 1);
      const traffic = b.trafficEstimate || "1.2M";
      const verif = b.verificationStatus || (st === "Done" ? "Live" : "Pending");
      const note = b.notes || "";
      const dtSub = toSqlDate(b.dateSubmitted);
      const dtVer = toSqlDate(b.dateVerified);
      const dtChk = toSqlDate(b.lastChecked);

      if (type === "postgres") {
        await client.query(
          `INSERT INTO backlinks (
            id, project_id, website_name, website_url, submitted_url,
            type, status, anchor_text, link_attribute, domain_rating,
            spam_score, traffic_estimate, verification_status, notes,
            date_submitted, date_verified, last_checked, da
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (id) DO UPDATE SET
            project_id = EXCLUDED.project_id,
            website_name = EXCLUDED.website_name,
            website_url = EXCLUDED.website_url,
            submitted_url = EXCLUDED.submitted_url,
            type = EXCLUDED.type,
            status = EXCLUDED.status,
            anchor_text = EXCLUDED.anchor_text,
            link_attribute = EXCLUDED.link_attribute,
            domain_rating = EXCLUDED.domain_rating,
            spam_score = EXCLUDED.spam_score,
            traffic_estimate = EXCLUDED.traffic_estimate,
            verification_status = EXCLUDED.verification_status,
            notes = EXCLUDED.notes,
            date_submitted = EXCLUDED.date_submitted,
            date_verified = EXCLUDED.date_verified,
            last_checked = EXCLUDED.last_checked,
            da = EXCLUDED.da`,
          [blId, pId, name, webUrl, subUrl, btype, st, anchor, attr, dr, spam, traffic, verif, note, dtSub, dtVer, dtChk, dr]
        );
      } else if (type === "mysql") {
        await client.query(
          `INSERT INTO backlinks (
            id, project_id, website_name, website_url, submitted_url,
            type, status, anchor_text, link_attribute, domain_rating,
            spam_score, traffic_estimate, verification_status, notes,
            date_submitted, date_verified, last_checked, da
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            project_id = VALUES(project_id),
            website_name = VALUES(website_name),
            website_url = VALUES(website_url),
            submitted_url = VALUES(submitted_url),
            type = VALUES(type),
            status = VALUES(status),
            anchor_text = VALUES(anchor_text),
            link_attribute = VALUES(link_attribute),
            domain_rating = VALUES(domain_rating),
            spam_score = VALUES(spam_score),
            traffic_estimate = VALUES(traffic_estimate),
            verification_status = VALUES(verification_status),
            notes = VALUES(notes),
            date_submitted = VALUES(date_submitted),
            date_verified = VALUES(date_verified),
            last_checked = VALUES(last_checked),
            da = VALUES(da)`,
          [blId, pId, name, webUrl, subUrl, btype, st, anchor, attr, dr, spam, traffic, verif, note, dtSub, dtVer, dtChk, dr]
        );
      } else {
        client
          .prepare(
            `INSERT INTO backlinks (
              id, project_id, website_name, website_url, submitted_url,
              type, status, anchor_text, link_attribute, domain_rating,
              spam_score, traffic_estimate, verification_status, notes,
              date_submitted, date_verified, last_checked, da
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
              project_id = excluded.project_id,
              website_name = excluded.website_name,
              website_url = excluded.website_url,
              submitted_url = excluded.submitted_url,
              type = excluded.type,
              status = excluded.status,
              anchor_text = excluded.anchor_text,
              link_attribute = excluded.link_attribute,
              domain_rating = excluded.domain_rating,
              spam_score = excluded.spam_score,
              traffic_estimate = excluded.traffic_estimate,
              verification_status = excluded.verification_status,
              notes = excluded.notes,
              date_submitted = excluded.date_submitted,
              date_verified = excluded.date_verified,
              last_checked = excluded.last_checked,
              da = excluded.da`
          )
          .run(blId, pId, name, webUrl, subUrl, btype, st, anchor, attr, dr, spam, traffic, verif, note, dtSub ? dtSub.toISOString() : null, dtVer ? dtVer.toISOString() : null, dtChk ? dtChk.toISOString() : null, dr);
      }
    }

    res.json({ success: true, count: backlinks.length });
  } catch (err) {
    res.status(500).json({ error: "Bulk import failed: " + err.message });
  }
});

export default router;
