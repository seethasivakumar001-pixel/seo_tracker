import React, { useEffect, useState, useRef } from "react";

export default function ConfirmDeleteModal({ modal, onClose }) {
  const [typedProjectName, setTypedProjectName] = useState("");
  const [categoryKeywordChoice, setCategoryKeywordChoice] = useState("cascade"); // "cascade" | "uncategorize"
  const [restoredCategoryName, setRestoredCategoryName] = useState(
    modal?.initialName || (modal?.category ? `${modal.category.name} (restored)` : "")
  );
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [modal]);

  if (!modal) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card confirm-delete-card"
        style={{ maxWidth: modal.type === "deleteProject" ? 500 : 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background:
                  modal.type === "nameConflict" || modal.type?.startsWith("restore")
                    ? "rgba(99, 102, 241, 0.15)"
                    : "rgba(244, 63, 94, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color:
                  modal.type === "nameConflict" || modal.type?.startsWith("restore")
                    ? "var(--accent, #6366f1)"
                    : "var(--down, #f43f5e)",
                flexShrink: 0,
              }}
            >
              {modal.type === "nameConflict" || modal.type?.startsWith("restore") ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: "1.1rem" }}>
                {modal.title || "Confirm Action"}
              </h3>
            </div>
          </div>
          <button className="link" onClick={onClose} style={{ fontSize: "1.1rem" }}>
            ✕
          </button>
        </div>

        {/* 1. Category Delete Modal */}
        {modal.type === "deleteCategory" && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: "0.9rem", color: "var(--ink)", lineHeight: 1.5 }}>
              You are about to delete category <strong>"{modal.category.name}"</strong>.
            </p>

            {modal.keywordCount > 0 && (
              <div
                style={{
                  marginTop: 14,
                  background: "var(--panel-subtle)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: "14px 16px",
                }}
              >
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)", marginBottom: 10 }}>
                  This category contains {modal.keywordCount} {modal.keywordCount === 1 ? "keyword" : "keywords"}. What would you like to do?
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      cursor: "pointer",
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: categoryKeywordChoice === "cascade" ? "rgba(244, 63, 94, 0.08)" : "transparent",
                      border: `1px solid ${categoryKeywordChoice === "cascade" ? "rgba(244, 63, 94, 0.3)" : "transparent"}`,
                    }}
                  >
                    <input
                      type="radio"
                      name="catDeleteChoice"
                      value="cascade"
                      checked={categoryKeywordChoice === "cascade"}
                      onChange={() => setCategoryKeywordChoice("cascade")}
                      style={{ marginTop: 3 }}
                    />
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>
                        Move all {modal.keywordCount} keywords to Trash
                      </div>
                      <div className="muted" style={{ fontSize: "0.75rem" }}>
                        Keywords can be restored later or will auto-purge after 30 days.
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      cursor: "pointer",
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: categoryKeywordChoice === "uncategorize" ? "rgba(99, 102, 241, 0.08)" : "transparent",
                      border: `1px solid ${categoryKeywordChoice === "uncategorize" ? "rgba(99, 102, 241, 0.3)" : "transparent"}`,
                    }}
                  >
                    <input
                      type="radio"
                      name="catDeleteChoice"
                      value="uncategorize"
                      checked={categoryKeywordChoice === "uncategorize"}
                      onChange={() => setCategoryKeywordChoice("uncategorize")}
                      style={{ marginTop: 3 }}
                    />
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>
                        Keep keywords and move to "Uncategorized"
                      </div>
                      <div className="muted" style={{ fontSize: "0.75rem" }}>
                        Keywords remain active in the tracker under the General category.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  modal.onConfirm(categoryKeywordChoice);
                  onClose();
                }}
              >
                Delete Category
              </button>
            </div>
          </div>
        )}

        {/* 2. Project Delete Modal */}
        {modal.type === "deleteProject" && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: "0.9rem", color: "var(--ink)", lineHeight: 1.5 }}>
              Are you sure you want to move project <strong>"{modal.project.name}"</strong> to Trash?
            </p>
            <p className="muted" style={{ fontSize: "0.82rem", marginTop: 6 }}>
              This will also move all associated categories and keywords into Trash.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  modal.onConfirm();
                  onClose();
                }}
              >
                Move Project to Trash
              </button>
            </div>
          </div>
        )}

        {/* 3. Single Item Purge Modal */}
        {modal.type === "purgeItem" && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: "0.92rem", color: "var(--ink, #f8fafc)", lineHeight: 1.5 }}>
              Are you sure you want to permanently delete {modal.itemType || "item"}{" "}
              <strong>"{modal.itemName || modal.item?.keyword || modal.item?.name || modal.item?.websiteName || "this item"}"</strong>?
            </p>
            <div
              style={{
                marginTop: 12,
                background: "rgba(244, 63, 94, 0.08)",
                border: "1px solid rgba(244, 63, 94, 0.25)",
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: "0.82rem",
                color: "var(--down, #f43f5e)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>⚠️</span>
              <span>This action is permanent and cannot be undone or recovered.</span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  if (modal.onConfirm) modal.onConfirm();
                  onClose();
                }}
              >
                Delete Forever
              </button>
            </div>
          </div>
        )}

        {/* 3b. Bulk Purge Modal */}
        {modal.type === "purgeBulk" && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: "0.92rem", color: "var(--ink, #f8fafc)", lineHeight: 1.5 }}>
              Are you sure you want to permanently delete{" "}
              <strong>{modal.count} {modal.itemType || "items"}</strong>?
            </p>
            <div
              style={{
                marginTop: 12,
                background: "rgba(244, 63, 94, 0.08)",
                border: "1px solid rgba(244, 63, 94, 0.25)",
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: "0.82rem",
                color: "var(--down, #f43f5e)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>⚠️</span>
              <span>All selected items will be completely purged and cannot be recovered.</span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  if (modal.onConfirm) modal.onConfirm();
                  onClose();
                }}
              >
                Delete Forever ({modal.count})
              </button>
            </div>
          </div>
        )}

        {/* 3c. Empty Trash / Purge All Modal */}
        {(modal.type === "purgeAll" || modal.type === "emptyTrash") && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: "0.92rem", color: "var(--ink, #f8fafc)", lineHeight: 1.5 }}>
              {modal.message || "Are you sure you want to permanently empty the entire trash? All trashed projects, categories, keywords, and backlinks will be removed forever."}
            </p>
            <div
              style={{
                marginTop: 12,
                background: "rgba(244, 63, 94, 0.08)",
                border: "1px solid rgba(244, 63, 94, 0.25)",
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: "0.82rem",
                color: "var(--down, #f43f5e)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>⚠️</span>
              <span>This will permanently wipe all items currently in Trash.</span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  if (modal.onConfirm) modal.onConfirm();
                  onClose();
                }}
              >
                Empty Trash Forever
              </button>
            </div>
          </div>
        )}

        {/* 4. Restore Category with Parent Trashed */}
        {modal.type === "restoreCategoryParentTrashed" && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: "0.9rem", color: "var(--ink)", lineHeight: 1.5 }}>
              The project <strong>"{modal.projectName}"</strong> for this category is currently in Trash.
            </p>
            <div
              style={{
                marginTop: 12,
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                padding: "12px 14px",
                borderRadius: 8,
                fontSize: "0.85rem",
                color: "var(--ink)",
              }}
            >
              Restoring this category will also restore the parent project <strong>"{modal.projectName}"</strong>.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="trash-restore-btn"
                onClick={() => {
                  modal.onConfirm();
                  onClose();
                }}
              >
                Restore Both
              </button>
            </div>
          </div>
        )}

        {/* 5. Restore Keyword with Category Trashed */}
        {modal.type === "restoreKeywordCategoryTrashed" && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: "0.9rem", color: "var(--ink)", lineHeight: 1.5 }}>
              The category <strong>"{modal.categoryName}"</strong> for keyword <strong>"{modal.keyword.keyword}"</strong> is currently in Trash.
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--ink)", marginTop: 10 }}>
              Choose how you'd like to restore this keyword:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="trash-restore-btn"
                style={{ justifyContent: "center", padding: "10px 14px" }}
                onClick={() => {
                  modal.onRestoreBoth();
                  onClose();
                }}
              >
                Restore Category & Keyword
              </button>
              <button
                type="button"
                className="btn-cancel"
                style={{ justifyContent: "center", padding: "10px 14px", textAlign: "center" }}
                onClick={() => {
                  modal.onRestoreToGeneral();
                  onClose();
                }}
              >
                Restore Keyword to "Uncategorized"
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
