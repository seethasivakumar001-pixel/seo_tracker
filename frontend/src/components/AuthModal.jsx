import React, { useState } from "react";
import { apiLogin } from "../services/keywordApi";

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiLogin({ email: formData.email, password: formData.password });
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
      const demoUser = {
        id: "usr_admin",
        name: "Admin User",
        email: "admin@seotracker.io",
        createdAt: new Date().toISOString(),
      };
      onAuthSuccess(demoUser, "demo-jwt-token-xyz");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(5, 7, 15, 0.7)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 24,
          background: "var(--card-bg, #0e1322)",
          border: "1px solid var(--line, rgba(255, 255, 255, 0.1))",
          borderRadius: 16,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(0, 98, 255, 0.15)",
                color: "var(--accent, #0062ff)",
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
                Welcome Back
              </h3>
              <p className="muted" style={{ fontSize: "0.8rem", marginTop: 2 }}>
                Sign in to sync your SEO workspaces
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
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, color: "var(--ink, #f8fafc)" }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@syscorp.io"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, color: "var(--ink, #f8fafc)" }}>
              Password
            </label>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ width: "100%", padding: "8px 36px 8px 12px", borderRadius: 8 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center"
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-header-primary"
            disabled={loading}
            style={{ marginTop: 6, padding: "10px", width: "100%", justifyContent: "center" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: "center", borderTop: "1px solid var(--line, rgba(255, 255, 255, 0.08))", paddingTop: 14 }}>
          <button
            type="button"
            className="btn-header-outline"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={handleQuickDemo}
          >
            ⚡ Quick Demo Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}
