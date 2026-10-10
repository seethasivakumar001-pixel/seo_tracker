import React, { useState, useEffect, useMemo } from "react";
import { useSeoStore } from "../store/seoStore";
import TrashPanel from "../components/TrashPanel";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import UndoToast from "../components/UndoToast";
import AuthModal from "../components/AuthModal";
import AddKeywordView from "../components/AddKeywordView";
import Monthly from "../components/Monthly";
import { getDifficultyInfo, formatPosition, formatVolume } from "../data/keywordData";
import { Sparkline } from "../components/Sparkline";

export default function KeywordTracker() {
  const {
    keywords,
    categories,
    projects,
    activeProjectId,
    setActiveProjectId,
    dbStatus,
    currentUser,
    setUser,
    logout,
    loadDbData,
    addKeyword,
    softDeleteKeyword,
    restoreKeyword,
    purgeKeyword,
    addCategory,
    softDeleteCategory,
    restoreCategory,
    purgeCategory,
    addProject,
    softDeleteProject,
    restoreProject,
    purgeProject,
    emptyTrash,
  } = useSeoStore();

  const [activeTab, setActiveTab] = useState("daily"); // "daily" | "monthly"
  const [showTrash, setShowTrash] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddView, setShowAddView] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [undoToast, setUndoToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  useEffect(() => {
    loadDbData();
  }, []);

  // Filter active vs trashed items
  const activeProjects = useMemo(() => projects.filter((p) => !p.deletedAt), [projects]);
  const trashedProjects = useMemo(() => projects.filter((p) => p.deletedAt), [projects]);

  const activeCategories = useMemo(
    () => categories.filter((c) => !c.deletedAt && (!activeProjectId || c.projectId === activeProjectId)),
    [categories, activeProjectId]
  );
  const trashedCategories = useMemo(() => categories.filter((c) => c.deletedAt), [categories]);

  const activeKeywords = useMemo(
    () =>
      keywords.filter(
        (k) =>
          !k.deletedAt &&
          (!activeProjectId || k.projectId === activeProjectId || k.websiteId === activeProjectId)
      ),
    [keywords, activeProjectId]
  );
  const trashedKeywords = useMemo(() => keywords.filter((k) => k.deletedAt), [keywords]);

  // Current active project
  const currentProject = useMemo(
    () => activeProjects.find((p) => p.id === activeProjectId) || activeProjects[0] || { name: "Default Project", domain: "example.com" },
    [activeProjects, activeProjectId]
  );

  // Filter keywords by search and category
  const filteredKeywords = useMemo(() => {
    return activeKeywords.filter((k) => {
      const matchSearch =
        !searchQuery.trim() ||
        k.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (k.group && k.group.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (k.url && k.url.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat =
        selectedCategoryFilter === "all" ||
        (k.group && k.group.toLowerCase() === selectedCategoryFilter.toLowerCase());

      return matchSearch && matchCat;
    });
  }, [activeKeywords, searchQuery, selectedCategoryFilter]);

  // Handle Soft Delete with Undo Toast
  const handleDeleteKeywordClick = (kw) => {
    softDeleteKeyword(kw.id);
    setUndoToast({
      message: `Keyword "${kw.keyword}" moved to Trash.`,
      undoAction: () => restoreKeyword(kw.id),
      duration: 6000,
    });
  };

  const handleDeleteCategoryClick = (cat) => {
    const kwCount = activeKeywords.filter((k) => k.group === cat.name).length;
    setDeleteModal({
      type: "deleteCategory",
      title: "Delete Category",
      category: cat,
      keywordCount: kwCount,
      onConfirm: (choice) => {
        softDeleteCategory(cat.id, choice);
        setUndoToast({
          message: `Category "${cat.name}" moved to Trash.`,
          undoAction: () => restoreCategory(cat.id),
          duration: 6000,
        });
      },
    });
  };

  const handleDeleteProjectClick = (proj) => {
    setDeleteModal({
      type: "deleteProject",
      title: "Move Project to Trash",
      project: proj,
      onConfirm: () => {
        softDeleteProject(proj.id);
        setUndoToast({
          message: `Project "${proj.name}" moved to Trash.`,
          undoAction: () => restoreProject(proj.id),
          duration: 6000,
        });
      },
    });
  };

  if (showAddView) {
    return (
      <AddKeywordView
        onBack={() => setShowAddView(false)}
        onAdd={(newKw) => {
          addKeyword({ ...newKw, projectId: activeProjectId });
          setUndoToast({
            message: `Added "${newKw.keyword}" to tracking.`,
            duration: 4000,
          });
        }}
        defaultDomain={currentProject.domain || "example.com"}
        availableCategories={activeCategories.map((c) => c.name)}
      />
    );
  }

  return (
    <div className="keyword-tracker-panel space-y-6">
      {/* Top Header & DB Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Keyword Rankings & SERP Intelligence
            </h1>
            {dbStatus.connected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                DB Synced ({dbStatus.database || "MySQL"})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Local Cache (Offline)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time rank tracking, historical SERP variance, and cascading soft-delete recovery for{" "}
            <span className="font-semibold text-indigo-500">{currentProject.domain || currentProject.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Auth Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{currentUser.name}</span>
              <button
                type="button"
                onClick={logout}
                className="text-slate-400 hover:text-rose-500 font-medium ml-1 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-header-outline"
              onClick={() => setShowAuthModal(true)}
            >
              🔐 Sign In
            </button>
          )}

          {/* Trash Drawer Button */}
          <button
            type="button"
            className="btn-header-ghost relative"
            onClick={() => setShowTrash(true)}
          >
            🗑️ Trash
            {trashedKeywords.length + trashedCategories.length + trashedProjects.length > 0 && (
              <span className="trash-badge ml-1.5">
                {trashedKeywords.length + trashedCategories.length + trashedProjects.length}
              </span>
            )}
          </button>

          {/* Add Keyword Button */}
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowAddView(true)}
          >
            + Add Keyword
          </button>
        </div>
      </div>

      {/* Project Switcher Bar */}
      {activeProjects.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Project:</span>
          {activeProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProjectId(p.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                p.id === activeProjectId
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>{p.name}</span>
              {activeProjects.length > 1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProjectClick(p);
                  }}
                  className="opacity-50 hover:opacity-100 text-[10px] ml-1"
                  title="Move Project to Trash"
                >
                  ✕
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main Tabs (Daily vs Monthly Comparison) */}
      <div className="tabs flex gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <button
          className={`tab-btn ${activeTab === "daily" ? "active" : ""}`}
          onClick={() => setActiveTab("daily")}
        >
          Daily Rank & SERP Intelligence
        </button>
        <button
          className={`tab-btn ${activeTab === "monthly" ? "active" : ""}`}
          onClick={() => setActiveTab("monthly")}
        >
          Monthly Variance Comparison
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "monthly" ? (
        <Monthly
          rows={activeKeywords}
          setRows={(updatedRows) => {
            // Updated in memory and sync
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="toolbar-search-wrap w-full sm:w-72">
              <input
                placeholder="Search keywords, URLs, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                className={`category-chip ${selectedCategoryFilter === "all" ? "active" : ""}`}
                onClick={() => setSelectedCategoryFilter("all")}
              >
                All Categories ({activeKeywords.length})
              </button>
              {activeCategories.map((c) => (
                <div key={c.id} className="relative group flex items-center">
                  <button
                    className={`category-chip ${selectedCategoryFilter === c.name ? "active" : ""}`}
                    onClick={() => setSelectedCategoryFilter(c.name)}
                  >
                    {c.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategoryClick(c)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-slate-400 hover:text-rose-500 text-xs px-1"
                    title="Delete Category"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords Table */}
          <div className="tablewrap rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Target Keyword</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Rank</th>
                  <th className="py-3 px-4 text-center">Change</th>
                  <th className="py-3 px-4 text-right">Search Volume</th>
                  <th className="py-3 px-4 text-center">KD%</th>
                  <th className="py-3 px-4 text-center" style={{ width: 140 }}>30-Day Trend</th>
                  <th className="py-3 px-4 text-right" style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredKeywords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No keywords found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredKeywords.map((kw) => {
                    const kd = getDifficultyInfo(kw.difficulty || 35);
                    const sparklineData = Array.isArray(kw.history30d) && kw.history30d.length > 0
                      ? kw.history30d
                      : Array.isArray(kw.history) && kw.history.length > 0
                      ? kw.history
                      : [kw.position || 50];

                    return (
                      <tr key={kw.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          <div>{kw.keyword}</div>
                          {kw.url && (
                            <a
                              href={kw.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-normal text-slate-400 hover:text-indigo-500 truncate max-w-xs block"
                            >
                              {kw.url}
                            </a>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="category-chip text-[10px]">
                            {kw.group || "General"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-100">
                          {formatPosition(kw.position)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold">
                          {kw.change > 0 ? (
                            <span className="text-emerald-500">▲ +{kw.change}</span>
                          ) : kw.change < 0 ? (
                            <span className="text-rose-500">▼ {kw.change}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300 font-medium">
                          {formatVolume(kw.volume)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{ color: kd.color, background: kd.bg }}
                          >
                            {kd.score}% {kd.level}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="w-24 h-6 mx-auto">
                            <Sparkline data={sparklineData} height={24} color={kw.change >= 0 ? "#10b981" : "#f43f5e"} />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteKeywordClick(kw)}
                            className="action-btn delete-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Move to Trash"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trash Panel Slide-Over */}
      {showTrash && (
        <TrashPanel
          isOpen={showTrash}
          onClose={() => setShowTrash(false)}
          trashedProjects={trashedProjects}
          trashedCategories={trashedCategories}
          trashedKeywords={trashedKeywords}
          allProjects={projects}
          allCategories={categories}
          onRestoreProject={(p) => restoreProject(p.id)}
          onRestoreCategory={(c) => restoreCategory(c.id)}
          onRestoreKeyword={(k) => restoreKeyword(k.id)}
          onPurgeProject={(p) => purgeProject(p.id)}
          onPurgeCategory={(c) => purgeCategory(c.id)}
          onPurgeKeyword={(k) => purgeKeyword(k.id)}
          onBulkRestore={(type, ids) => {
            if (type === "projects") ids.forEach((id) => restoreProject(id));
            else if (type === "categories") ids.forEach((id) => restoreCategory(id));
            else ids.forEach((id) => restoreKeyword(id));
          }}
          onBulkPurge={(type, ids) => {
            if (type === "projects") ids.forEach((id) => purgeProject(id));
            else if (type === "categories") ids.forEach((id) => purgeCategory(id));
            else ids.forEach((id) => purgeKeyword(id));
          }}
          onEmptyTrash={emptyTrash}
        />
      )}

      {/* Confirm Cascading Delete Modal */}
      {deleteModal && (
        <ConfirmDeleteModal
          modal={deleteModal}
          onClose={() => setDeleteModal(null)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={(user, token) => setUser(user, token)}
        />
      )}

      {/* Undo Notification Toast */}
      {undoToast && (
        <UndoToast
          toast={undoToast}
          onDismiss={() => setUndoToast(null)}
        />
      )}
    </div>
  );
}
