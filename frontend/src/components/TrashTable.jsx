import React from "react";
import { formatRelativeTime } from "../data/keywordData";
import { useSEOStore } from "../store/seoStore";

export default function TrashTable({
  type, // "projects" | "categories" | "keywords" | "backlinks"
  items,
  projects = [],
  _categories = [],
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onRestore,
  onDeleteForever,
}) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));
  const someSelected = items.some((item) => selectedIds.includes(item.id)) && !allSelected;

  const storeProjects = useSEOStore((s) => s.projects) || [];
  const storeWebsites = useSEOStore((s) => s.websites) || [];
  const effectiveProjects = (projects && projects.length > 0) ? projects : (storeProjects.length > 0 ? storeProjects : storeWebsites);

  const getParentLabel = (item) => {
    if (type === "projects") {
      return item.domain || "–";
    }
    if (type === "categories") {
      const projId = item.projectId || item.websiteId || item.project_id;
      const proj = effectiveProjects.find(
        (p) => p.id === projId || (projId === "p1" && p.id === "site-1") || (projId === "site-1" && p.id === "p1")
      );
      return proj ? (proj.name || proj.domain) : (projId || "–");
    }
    if (type === "keywords") {
      const projId = item.projectId || item.websiteId || item.project_id;
      const proj = effectiveProjects.find(
        (p) => p.id === projId || (projId === "p1" && p.id === "site-1") || (projId === "site-1" && p.id === "p1")
      );
      const projName = proj ? (proj.name || proj.domain) : "–";
      const catName = item.group || "Uncategorized";
      return `${projName} > ${catName}`;
    }
    if (type === "backlinks") {
      const projId = item.projectId || item.websiteId || item.project_id;
      const proj = effectiveProjects.find(
        (p) => p.id === projId || (projId === "p1" && p.id === "site-1") || (projId === "site-1" && p.id === "p1")
      );
      return proj ? (proj.name || proj.domain) : (item.submittedUrl || item.projectId || "–");
    }
    if (type === "blogs") {
      const projId = item.projectId || item.websiteId || item.project_id;
      const proj = effectiveProjects.find(
        (p) => p.id === projId || (projId === "p1" && p.id === "site-1") || (projId === "site-1" && p.id === "p1")
      );
      const projName = proj ? (proj.name || proj.domain) : (item.domain || "–");
      return `${projName} (${item.category || "General"})`;
    }
    return "–";
  };

  if (!items.length) {
    return (
      <div className="trash-empty-state py-12 px-4 text-center">
        <svg
          className="w-10 h-10 mx-auto mb-3 text-slate-400 dark:text-slate-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1 text-sm">
          No {type} in Trash
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Deleted {type} will show up here until permanently removed.
        </p>
      </div>
    );
  }

  return (
    <div className="tablewrap trash-tablewrap rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto" style={{ maxHeight: 420 }}>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="w-12 px-4 py-3.5 text-center align-middle">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked ? items.map((i) => i.id) : [])}
                  aria-label={`Select all ${type}`}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer align-middle"
                />
              </th>
              <th className="px-4 py-3.5 text-left align-middle min-w-[160px]">
                {type === "projects" ? "Project Name" : type === "categories" ? "Category Name" : type === "backlinks" ? "Backlink Source" : "Keyword"}
              </th>
              <th className="px-4 py-3.5 text-left align-middle min-w-[180px]">
                {type === "projects" ? "Website Domain" : "Original Location / Target"}
              </th>
              <th className="w-44 px-4 py-3.5 text-left align-middle whitespace-nowrap">
                Deleted Date
              </th>
              <th className="w-[230px] px-4 py-3.5 text-right align-middle whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <tr
                  key={item.id}
                  className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                    isSelected ? "bg-indigo-50/50 dark:bg-indigo-950/20" : ""
                  }`}
                >
                  <td className="w-12 px-4 py-3 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(item.id)}
                      aria-label={`Select ${item.name || item.keyword || item.websiteName}`}
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer align-middle"
                    />
                  </td>
                  <td className="px-4 py-3 text-left align-middle">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                      {item.title || item.name || item.keyword || item.websiteName}
                    </div>
                    {type === "keywords" && item.url && (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-xs font-normal">
                        {item.url}
                      </div>
                    )}
                    {type === "backlinks" && item.websiteUrl && (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-xs font-normal">
                        {item.websiteUrl}
                      </div>
                    )}
                    {type === "blogs" && item.url && (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-xs font-normal">
                        {item.url}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-left align-middle text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-normal truncate block max-w-xs">
                      {type === "backlinks" ? (item.submittedUrl || getParentLabel(item)) : getParentLabel(item)}
                    </span>
                  </td>
                  <td className="w-44 px-4 py-3 text-left align-middle whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                      {formatRelativeTime(item.deletedAt)}
                    </span>
                  </td>
                  <td className="w-[230px] px-4 py-3 text-right align-middle whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="trash-restore-btn"
                        onClick={() => onRestore(item)}
                        title="Restore item"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                        </svg>
                        <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        className="trash-delete-forever-btn"
                        onClick={() => onDeleteForever(item)}
                        title="Permanently delete item"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        </svg>
                        <span>Delete Forever</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
