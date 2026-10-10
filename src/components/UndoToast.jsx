import React, { useEffect, useState } from "react";

export default function UndoToast({ toast, onDismiss }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;
    const duration = toast.duration || 6000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <aside
      className="undo-toast"
      role="status"
      aria-live="polite"
      style={{ overflow: "hidden", position: "fixed", bottom: 24, right: 24, zIndex: 120 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: "0.88rem", color: "var(--ink, #f8fafc)" }}>
          {toast.message}
        </span>

        {toast.undoAction && (
          <button
            type="button"
            className="undo-btn"
            onClick={() => {
              toast.undoAction();
              onDismiss();
            }}
          >
            Undo
          </button>
        )}

        {toast.viewAction && (
          <button
            type="button"
            className="undo-btn"
            style={{ background: "var(--up, #10b981)", color: "#0b0f19", fontWeight: 700 }}
            onClick={() => {
              toast.viewAction();
              onDismiss();
            }}
          >
            View
          </button>
        )}

        <button
          type="button"
          className="link"
          style={{ fontSize: "0.95rem", color: "var(--mute, #94a3b8)", cursor: "pointer", padding: "2px 4px", background: "none", border: "none" }}
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>

      <div
        className="toast-progress-bar"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "3px",
          width: `${progress}%`,
          background: toast.viewAction ? "var(--up, #10b981)" : "var(--accent, #6366f1)",
          transition: "width 50ms linear",
        }}
      />
    </aside>
  );
}
