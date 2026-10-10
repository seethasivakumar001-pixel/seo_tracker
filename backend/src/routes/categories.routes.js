import express from "express";
import { getDb } from "../config/db.js";

const router = express.Router();

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

// GET /api/categories
router.get("/", async (req, res) => {
  try {
    const { projectId } = req.query;
    const { client, type } = await getDb();
    let rows = [];

    if (projectId) {
      if (type === "postgres") {
        const r = await client.query(
          "SELECT * FROM categories WHERE project_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC",
          [projectId]
        );
        rows = r.rows;
      } else if (type === "mysql") {
        const [r] = await client.query(
          "SELECT * FROM categories WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
          [projectId]
        );
        rows = r;
      } else {
        rows = client
          .prepare("SELECT * FROM categories WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at ASC")
          .all(projectId);
      }
    } else {
      if (type === "postgres") {
        const r = await client.query("SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY created_at ASC");
        rows = r.rows;
      } else if (type === "mysql") {
        const [r] = await client.query("SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY created_at ASC");
        rows = r;
      } else {
        rows = client.prepare("SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY created_at ASC").all();
      }
    }

    res.json(rows.map(formatCategoryRow));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories: " + err.message });
  }
});

// POST /api/categories
router.post("/", async (req, res) => {
  try {
    const { id, name, projectId } = req.body;
    if (!name) return res.status(400).json({ error: "Category name is required." });

    const catId = id || "cat-" + Date.now().toString(36);
    const pId = projectId || "proj-1";
    const { client, type } = await getDb();

    if (type === "postgres") {
      const r = await client.query(
        "INSERT INTO categories (id, name, project_id) VALUES ($1, $2, $3) RETURNING *",
        [catId, name.trim(), pId]
      );
      return res.status(201).json(formatCategoryRow(r.rows[0]));
    } else if (type === "mysql") {
      await client.query("INSERT INTO categories (id, name, project_id) VALUES (?, ?, ?)", [
        catId,
        name.trim(),
        pId,
      ]);
      const [r] = await client.query("SELECT * FROM categories WHERE id = ?", [catId]);
      return res.status(201).json(formatCategoryRow(r[0]));
    } else {
      client
        .prepare("INSERT INTO categories (id, name, project_id) VALUES (?, ?, ?)")
        .run(catId, name.trim(), pId);
      const r = client.prepare("SELECT * FROM categories WHERE id = ?").get(catId);
      return res.status(201).json(formatCategoryRow(r));
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to create category: " + err.message });
  }
});

function toSqlDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// PUT / PATCH /api/categories/:id
const updateCategoryHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, deletedAt, deletedWith } = req.body;
    const { client, type } = await getDb();
    const parsedDeletedAt = toSqlDate(deletedAt);

    if (type === "postgres") {
      const r = await client.query(
        `UPDATE categories SET
          name = COALESCE($1, name),
          deleted_at = $2,
          deleted_with = $3
        WHERE id = $4 RETURNING *`,
        [name, parsedDeletedAt, deletedWith || null, id]
      );
      return res.json(formatCategoryRow(r.rows[0]));
    } else if (type === "mysql") {
      await client.query(
        `UPDATE categories SET
          name = COALESCE(?, name),
          deleted_at = ?,
          deleted_with = ?
        WHERE id = ?`,
        [name, parsedDeletedAt, deletedWith || null, id]
      );
      const [r] = await client.query("SELECT * FROM categories WHERE id = ?", [id]);
      return res.json(formatCategoryRow(r[0]));
    } else {
      client
        .prepare(
          `UPDATE categories SET
            name = COALESCE(?, name),
            deleted_at = ?,
            deleted_with = ?
          WHERE id = ?`
        )
        .run(name, parsedDeletedAt ? parsedDeletedAt.toISOString() : null, deletedWith || null, id);
      const r = client.prepare("SELECT * FROM categories WHERE id = ?").get(id);
      return res.json(formatCategoryRow(r));
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update category: " + err.message });
  }
};

router.put("/:id", updateCategoryHandler);
router.patch("/:id", updateCategoryHandler);

// DELETE /api/categories/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    const { client, type } = await getDb();

    if (permanent === "true") {
      if (type === "postgres") {
        await client.query("DELETE FROM categories WHERE id = $1", [id]);
      } else if (type === "mysql") {
        await client.query("DELETE FROM categories WHERE id = ?", [id]);
      } else {
        client.prepare("DELETE FROM categories WHERE id = ?").run(id);
      }
      return res.json({ success: true, message: "Category permanently deleted" });
    }

    const now = new Date();
    if (type === "postgres") {
      await client.query("UPDATE categories SET deleted_at = $1 WHERE id = $2", [now, id]);
    } else if (type === "mysql") {
      await client.query("UPDATE categories SET deleted_at = ? WHERE id = ?", [now, id]);
    } else {
      client.prepare("UPDATE categories SET deleted_at = ? WHERE id = ?").run(now.toISOString(), id);
    }
    res.json({ success: true, message: "Category moved to trash" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete category: " + err.message });
  }
});

export default router;
