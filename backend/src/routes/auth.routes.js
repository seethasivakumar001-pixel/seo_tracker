import express from "express";
import { getDb, hashPassword, verifyPassword } from "../config/db.js";

const router = express.Router();

function formatUserRow(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar || null,
    createdAt: u.created_at || u.createdAt || null,
  };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const { client, type } = await getDb();

    let existing = null;
    if (type === "postgres") {
      const r = await client.query("SELECT * FROM users WHERE LOWER(email) = $1", [cleanEmail]);
      existing = r.rows[0];
    } else if (type === "mysql") {
      const [rows] = await client.query("SELECT * FROM users WHERE LOWER(email) = ?", [cleanEmail]);
      existing = rows[0];
    } else {
      existing = client.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(cleanEmail);
    }

    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const userId = "usr-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const passHash = hashPassword(password);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`;

    if (type === "postgres") {
      const ins = await client.query(
        "INSERT INTO users (id, name, email, password_hash, avatar) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [userId, cleanName, cleanEmail, passHash, avatar]
      );
      return res.status(201).json({ user: formatUserRow(ins.rows[0]) });
    } else if (type === "mysql") {
      await client.query(
        "INSERT INTO users (id, name, email, password_hash, avatar) VALUES (?, ?, ?, ?, ?)",
        [userId, cleanName, cleanEmail, passHash, avatar]
      );
      const [u] = await client.query("SELECT * FROM users WHERE id = ?", [userId]);
      return res.status(201).json({ user: formatUserRow(u[0]) });
    } else {
      client
        .prepare("INSERT INTO users (id, name, email, password_hash, avatar) VALUES (?, ?, ?, ?, ?)")
        .run(userId, cleanName, cleanEmail, passHash, avatar);
      const u = client.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      return res.status(201).json({ user: formatUserRow(u) });
    }
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "Failed to register user: " + err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const { client, type } = await getDb();

    let user = null;
    if (type === "postgres") {
      const r = await client.query("SELECT * FROM users WHERE LOWER(email) = $1", [cleanEmail]);
      user = r.rows[0];
    } else if (type === "mysql") {
      const [rows] = await client.query("SELECT * FROM users WHERE LOWER(email) = ?", [cleanEmail]);
      user = rows[0];
    } else {
      user = client.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(cleanEmail);
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.json({ user: formatUserRow(user) });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Login failed: " + err.message });
  }
});

// PUT /api/auth/profile
router.put("/profile", async (req, res) => {
  try {
    const { id, name, avatar, password } = req.body;
    if (!id) return res.status(400).json({ error: "User ID is required." });

    const { client, type } = await getDb();
    let updates = [];
    let params = [];

    if (name) {
      updates.push(type === "postgres" ? `name = $${params.length + 1}` : "name = ?");
      params.push(name.trim());
    }
    if (avatar) {
      updates.push(type === "postgres" ? `avatar = $${params.length + 1}` : "avatar = ?");
      params.push(avatar.trim());
    }
    if (password && password.length >= 6) {
      updates.push(type === "postgres" ? `password_hash = $${params.length + 1}` : "password_hash = ?");
      params.push(hashPassword(password));
    }

    if (updates.length === 0) return res.json({ message: "No changes provided." });

    if (type === "postgres") {
      params.push(id);
      const r = await client.query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = $${params.length} RETURNING *`,
        params
      );
      return res.json({ user: formatUserRow(r.rows[0]) });
    } else if (type === "mysql") {
      params.push(id);
      await client.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);
      const [u] = await client.query("SELECT * FROM users WHERE id = ?", [id]);
      return res.json({ user: formatUserRow(u[0]) });
    } else {
      params.push(id);
      client.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);
      const u = client.prepare("SELECT * FROM users WHERE id = ?").get(id);
      return res.json({ user: formatUserRow(u) });
    }
  } catch (err) {
    res.status(500).json({ error: "Profile update failed: " + err.message });
  }
});

export default router;
