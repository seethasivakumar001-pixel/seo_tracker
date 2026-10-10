import React, { useState } from "react";
import { apiLogin, apiRegister } from "../services/keywordApi";

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (mode === "login") {
        res = await apiLogin({ email: formData.email, password: formData.password });
      } else {
        res = await apiRegister({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      }

      if (res && res.user) {
        onAuthSuccess(res.user, res.token);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiLogin({ email: "admin@seotracker.io", password: "password123" });
      if (res && res.user) {
        onAuthSuccess(res.user, res.token);
        onClose();
      }
    } catch {
      // Fallback local demo admin login if API server is not yet running
      const demoUser = {
        id: "usr_admin",
        name: "Admin User",
        email: "admin@seotracker.io",
        createdAt: new Date().toISOString(),
      };
      onAuthSuccess(demoUser, "demo_token_admin");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card auth-modal-card"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(99, 102, 241, 0.15)",
                color: "var(--accent, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              🔐
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: "1.15rem" }}>
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h3>
              <p className="muted" style={{ fontSize: "0.8rem", marginTop: 2 }}>
                {mode === "login" ? "Sign in to sync your SEO workspaces" : "Register to track SERP intelligence"}
              </p>
            </div>
          </div>
          <button className="link" onClick={onClose} style={{ fontSize: "1.2rem" }}>
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              color: "var(--down, #f43f5e)",
              fontSize: "0.82rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, color: "var(--ink, #f8fafc)" }}>
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8 }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, color: "var(--ink, #f8fafc)" }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="admin@seotracker.io"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, color: "var(--ink, #f8fafc)" }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8 }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: 6, padding: "10px", width: "100%", justifyContent: "center" }}
          >
            {loading ? "Processing..." : mode === "login" ? "Sign In" : "Register"}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: "center", borderTop: "1px solid var(--line, rgba(255, 255, 255, 0.08))", paddingTop: 14 }}>
          <button
            type="button"
            className="btn-header-outline"
            style={{ width: "100%", justifyContent: "center", marginBottom: 10 }}
            onClick={handleQuickDemo}
          >
            ⚡ Quick Demo Admin Login
          </button>

          <p style={{ fontSize: "0.8rem", color: "var(--mute, #94a3b8)" }}>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="link"
              style={{ color: "var(--accent, #6366f1)", fontWeight: 600 }}
              onClick={() => {
                setError(null);
                setMode(mode === "login" ? "register" : "login");
              }}
            >
              {mode === "login" ? "Register here" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
