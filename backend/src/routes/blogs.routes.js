import express from "express";
import { getDb } from "../config/db.js";

const router = express.Router();

function toSqlDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
}

export function formatDateSafe(val) {
  if (!val) return null;
  if (typeof val === 'string') return val.split('T')[0].substring(0, 10);
  if (val instanceof Date) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(val).substring(0, 10);
}

export function formatBlogRow(b) {
  if (!b) return null;
  return {
    id: b.id,
    projectId: b.project_id || b.projectId || "site-1",
    domain: b.domain || "",
    title: b.title || "",
    url: b.url || "",
    focusKeyword: b.focus_keyword || b.focusKeyword || "",
    secondaryKeyword: b.secondary_keyword || b.secondaryKeyword || "",
    category: b.category || "General",
    author: b.author || "Admin",
    publishDate: formatDateSafe(b.publish_date),
    lastUpdated: formatDateSafe(b.last_updated),
    status: b.status || "Draft",
    deletedAt: b.deleted_at || b.deletedAt || null,
    deletedWith: b.deleted_with || b.deletedWith || null,
    createdAt: b.created_at || b.createdAt || new Date().toISOString()
  };
}

// GET /api/blogs - List all blogs
router.get("/", async (req, res) => {
  try {
    const { projectId, domain, includeDeleted } = req.query;
    const { client, type } = await getDb();
    let rows = [];

    const whereConditions = [];
    const params = [];
    let pIdx = 1;

    if (!includeDeleted || includeDeleted === "false") {
      whereConditions.push(type === "postgres" ? "deleted_at IS NULL" : "deleted_at IS NULL");
    }

    if (projectId) {
      if (type === "postgres") {
        whereConditions.push(`project_id = $${pIdx++}`);
      } else {
        whereConditions.push("project_id = ?");
      }
      params.push(projectId);
    }

    if (domain) {
      if (type === "postgres") {
        whereConditions.push(`(domain ILIKE $${pIdx++} OR url ILIKE $${pIdx++})`);
        params.push(`%${domain}%`, `%${domain}%`);
      } else if (type === "mysql") {
        whereConditions.push("(domain LIKE ? OR url LIKE ?)");
        params.push(`%${domain}%`, `%${domain}%`);
      } else {
        whereConditions.push("(domain LIKE ? OR url LIKE ?)");
        params.push(`%${domain}%`, `%${domain}%`);
      }
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
    const sql = `SELECT * FROM blogs ${whereSql} ORDER BY created_at DESC`;

    if (type === "postgres") {
      const r = await client.query(sql, params);
      rows = r.rows;
    } else if (type === "mysql") {
      const [r] = await client.query(sql, params);
      rows = r;
    } else {
      rows = client.prepare(sql).all(...params);
    }

    res.json(rows.map(formatBlogRow));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blogs: " + err.message });
  }
});

// POST /api/blogs - Create a new blog post
router.post("/", async (req, res) => {
  try {
    const {
      id,
      projectId,
      domain,
      title,
      url,
      focusKeyword,
      secondaryKeyword,
      category,
      author,
      publishDate,
      lastUpdated,
      status
    } = req.body;

    if (!title || !url) {
      return res.status(400).json({ error: "Title and URL are required" });
    }

    const blogId = id || `blog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const finalProjectId = projectId || "site-1";
    const finalDomain = domain || "";
    const finalCategory = category || "General";
    const finalAuthor = author || "Admin";
    const finalStatus = status || "Draft";
    const finalPubDate = toSqlDate(publishDate) || toSqlDate(new Date());
    const finalLastUpdated = toSqlDate(lastUpdated) || toSqlDate(new Date());

    const { client, type } = await getDb();

    if (type === "postgres") {
      await client.query(
        `INSERT INTO blogs (
          id, project_id, domain, title, url, focus_keyword, secondary_keyword,
          category, author, publish_date, last_updated, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          blogId,
          finalProjectId,
          finalDomain,
          title.trim(),
          url.trim(),
          focusKeyword ? focusKeyword.trim() : "",
          secondaryKeyword ? secondaryKeyword.trim() : "",
          finalCategory.trim(),
          finalAuthor.trim(),
          finalPubDate,
          finalLastUpdated,
          finalStatus
        ]
      );
    } else if (type === "mysql") {
      await client.query(
        `INSERT INTO blogs (
          id, project_id, domain, title, url, focus_keyword, secondary_keyword,
          category, author, publish_date, last_updated, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          blogId,
          finalProjectId,
          finalDomain,
          title.trim(),
          url.trim(),
          focusKeyword ? focusKeyword.trim() : "",
          secondaryKeyword ? secondaryKeyword.trim() : "",
          finalCategory.trim(),
          finalAuthor.trim(),
          finalPubDate,
          finalLastUpdated,
          finalStatus
        ]
      );
    } else {
      client.prepare(
        `INSERT INTO blogs (
          id, project_id, domain, title, url, focus_keyword, secondary_keyword,
          category, author, publish_date, last_updated, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        blogId,
        finalProjectId,
        finalDomain,
        title.trim(),
        url.trim(),
        focusKeyword ? focusKeyword.trim() : "",
        secondaryKeyword ? secondaryKeyword.trim() : "",
        finalCategory.trim(),
        finalAuthor.trim(),
        finalPubDate,
        finalLastUpdated,
        finalStatus
      );
    }

    res.status(201).json({
      success: true,
      blog: formatBlogRow({
        id: blogId,
        project_id: finalProjectId,
        domain: finalDomain,
        title: title.trim(),
        url: url.trim(),
        focus_keyword: focusKeyword,
        secondary_keyword: secondaryKeyword,
        category: finalCategory,
        author: finalAuthor,
        publish_date: finalPubDate,
        last_updated: finalLastUpdated,
        status: finalStatus,
        created_at: new Date().toISOString()
      })
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create blog post: " + err.message });
  }
});

// PATCH /api/blogs/:id - Update blog post
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      url,
      focusKeyword,
      secondaryKeyword,
      category,
      author,
      publishDate,
      lastUpdated,
      status,
      projectId,
      domain
    } = req.body;

    const { client, type } = await getDb();

    // Fetch existing
    let existing = null;
    if (type === "postgres") {
      const r = await client.query("SELECT * FROM blogs WHERE id = $1", [id]);
      existing = r.rows[0];
    } else if (type === "mysql") {
      const [r] = await client.query("SELECT * FROM blogs WHERE id = ?", [id]);
      existing = r[0];
    } else {
      existing = client.prepare("SELECT * FROM blogs WHERE id = ?").get(id);
    }

    if (!existing) {
      return res.status(404).json({ error: "Blog not found" });
    }

    const newTitle = title !== undefined ? title : existing.title;
    const newUrl = url !== undefined ? url : existing.url;
    const newFocus = focusKeyword !== undefined ? focusKeyword : existing.focus_keyword;
    const newSec = secondaryKeyword !== undefined ? secondaryKeyword : existing.secondary_keyword;
    const newCat = category !== undefined ? category : existing.category;
    const newAuthor = author !== undefined ? author : existing.author;
    const newPubDate = publishDate !== undefined ? toSqlDate(publishDate) : existing.publish_date;
    const newLastUpdated = lastUpdated !== undefined ? toSqlDate(lastUpdated) : toSqlDate(new Date());
    const newStatus = status !== undefined ? status : existing.status;
    const newProject = projectId !== undefined ? projectId : existing.project_id;
    const newDomain = domain !== undefined ? domain : existing.domain;

    if (type === "postgres") {
      await client.query(
        `UPDATE blogs SET
          title = $1, url = $2, focus_keyword = $3, secondary_keyword = $4,
          category = $5, author = $6, publish_date = $7, last_updated = $8,
          status = $9, project_id = $10, domain = $11
         WHERE id = $12`,
        [newTitle, newUrl, newFocus, newSec, newCat, newAuthor, newPubDate, newLastUpdated, newStatus, newProject, newDomain, id]
      );
    } else if (type === "mysql") {
      await client.query(
        `UPDATE blogs SET
          title = ?, url = ?, focus_keyword = ?, secondary_keyword = ?,
          category = ?, author = ?, publish_date = ?, last_updated = ?,
          status = ?, project_id = ?, domain = ?
         WHERE id = ?`,
        [newTitle, newUrl, newFocus, newSec, newCat, newAuthor, newPubDate, newLastUpdated, newStatus, newProject, newDomain, id]
      );
    } else {
      client.prepare(
        `UPDATE blogs SET
          title = ?, url = ?, focus_keyword = ?, secondary_keyword = ?,
          category = ?, author = ?, publish_date = ?, last_updated = ?,
          status = ?, project_id = ?, domain = ?
         WHERE id = ?`
      ).run(newTitle, newUrl, newFocus, newSec, newCat, newAuthor, newPubDate, newLastUpdated, newStatus, newProject, newDomain, id);
    }

    res.json({
      success: true,
      blog: formatBlogRow({
        id,
        project_id: newProject,
        domain: newDomain,
        title: newTitle,
        url: newUrl,
        focus_keyword: newFocus,
        secondary_keyword: newSec,
        category: newCat,
        author: newAuthor,
        publish_date: newPubDate,
        last_updated: newLastUpdated,
        status: newStatus
      })
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update blog: " + err.message });
  }
});

// DELETE /api/blogs/:id - Soft delete by default, or ?hard=true for purge
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;
    const { client, type } = await getDb();

    if (hard === "true") {
      if (type === "postgres") {
        await client.query("DELETE FROM blogs WHERE id = $1", [id]);
      } else if (type === "mysql") {
        await client.query("DELETE FROM blogs WHERE id = ?", [id]);
      } else {
        client.prepare("DELETE FROM blogs WHERE id = ?").run(id);
      }
      return res.json({ success: true, message: "Blog permanently purged" });
    }

    const now = new Date();
    if (type === "postgres") {
      await client.query("UPDATE blogs SET deleted_at = $1 WHERE id = $2", [now, id]);
    } else if (type === "mysql") {
      await client.query("UPDATE blogs SET deleted_at = ? WHERE id = ?", [now, id]);
    } else {
      client.prepare("UPDATE blogs SET deleted_at = ? WHERE id = ?").run(now.toISOString(), id);
    }

    res.json({ success: true, message: "Blog moved to Trash" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete blog: " + err.message });
  }
});

// POST /api/blogs/:id/restore - Restore from Trash
router.post("/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;
    const { client, type } = await getDb();

    if (type === "postgres") {
      await client.query("UPDATE blogs SET deleted_at = NULL, deleted_with = NULL WHERE id = $1", [id]);
    } else if (type === "mysql") {
      await client.query("UPDATE blogs SET deleted_at = NULL, deleted_with = NULL WHERE id = ?", [id]);
    } else {
      client.prepare("UPDATE blogs SET deleted_at = NULL, deleted_with = NULL WHERE id = ?").run(id);
    }

    res.json({ success: true, message: "Blog restored from Trash" });
  } catch (err) {
    res.status(500).json({ error: "Failed to restore blog: " + err.message });
  }
});

export default router;
