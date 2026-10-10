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

export default router;
