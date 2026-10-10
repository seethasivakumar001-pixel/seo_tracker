const API_BASE = "http://localhost:3001/api";

export async function checkServerHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    if (!res.ok) return { connected: false };
    const data = await res.json();
    return { connected: true, database: data.database };
  } catch {
    return { connected: false };
  }
}

export async function apiLogin({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = { error: `Server returned status ${res.status}` };
  }
  if (!res.ok) {
    throw new Error(data.error || "Failed to login");
  }
  return data;
}

export async function apiRegister({ name, email, password }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = { error: `Server returned status ${res.status}` };
  }
  if (!res.ok) {
    throw new Error(data.error || "Failed to register");
  }
  return data;
}

export async function apiGetMe(token) {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function apiLogout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST" });
  } catch (err) {
    console.warn("Logout error:", err);
  }
}

export async function fetchDatabaseData() {
  try {
    const res = await fetch(`${API_BASE}/data`);
    if (!res.ok) throw new Error("Failed to fetch from DB");
    return await res.json();
  } catch (err) {
    console.warn("DB offline, falling back to local data:", err.message);
    return null;
  }
}

export async function syncDatabase(payload) {
  try {
    const res = await fetch(`${API_BASE}/data/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.warn("DB sync failed:", err.message);
    return null;
  }
}

export async function apiCreateProject(project) {
  try {
    await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
  } catch (err) {
    console.warn("apiCreateProject failed:", err.message);
  }
}

export async function apiUpdateProject(id, updates) {
  try {
    await fetch(`${API_BASE}/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.warn("apiUpdateProject failed:", err.message);
  }
}

export async function apiDeleteProject(id) {
  try {
    await fetch(`${API_BASE}/projects/${id}`, { method: "DELETE" });
  } catch (err) {
    console.warn("apiDeleteProject failed:", err.message);
  }
}

export async function apiCreateCategory(category) {
  try {
    await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });
  } catch (err) {
    console.warn("apiCreateCategory failed:", err.message);
  }
}

export async function apiUpdateCategory(id, updates) {
  try {
    await fetch(`${API_BASE}/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.warn("apiUpdateCategory failed:", err.message);
  }
}

export async function apiDeleteCategory(id) {
  try {
    await fetch(`${API_BASE}/categories/${id}`, { method: "DELETE" });
  } catch (err) {
    console.warn("apiDeleteCategory failed:", err.message);
  }
}

export async function apiCreateKeyword(keyword) {
  try {
    await fetch(`${API_BASE}/keywords`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(keyword),
    });
  } catch (err) {
    console.warn("apiCreateKeyword failed:", err.message);
  }
}

export async function apiUpdateKeyword(id, updates) {
  try {
    await fetch(`${API_BASE}/keywords/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.warn("apiUpdateKeyword failed:", err.message);
  }
}

export async function apiDeleteKeyword(id) {
  try {
    await fetch(`${API_BASE}/keywords/${id}`, { method: "DELETE" });
  } catch (err) {
    console.warn("apiDeleteKeyword failed:", err.message);
  }
}

// Backlink CRUD APIs
export async function apiFetchBacklinks(projectId) {
  try {
    const url = projectId ? `${API_BASE}/backlinks?projectId=${projectId}` : `${API_BASE}/backlinks`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn("apiFetchBacklinks failed:", err.message);
    return [];
  }
}

export async function apiCreateBacklink(backlink) {
  try {
    const res = await fetch(`${API_BASE}/backlinks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backlink),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("apiCreateBacklink failed:", err.message);
  }
}

export async function apiUpdateBacklink(id, updates) {
  try {
    const res = await fetch(`${API_BASE}/backlinks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("apiUpdateBacklink failed:", err.message);
  }
}

export async function apiDeleteBacklink(id) {
  try {
    await fetch(`${API_BASE}/backlinks/${id}`, { method: "DELETE" });
  } catch (err) {
    console.warn("apiDeleteBacklink failed:", err.message);
  }
}

export async function apiBulkCreateBacklinks(backlinks) {
  try {
    const res = await fetch(`${API_BASE}/backlinks/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backlinks }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("apiBulkCreateBacklinks failed:", err.message);
  }
}
