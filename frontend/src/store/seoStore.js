import { create } from "zustand";
import { initialWebsites } from "../data/mockWebsites";
import { initialKeywords } from "../data/mockKeywords";
import { initialProjects, initialCategories } from "../data/keywordData";
import {
  fetchDatabaseData,
  checkServerHealth,
  apiCreateKeyword,
  apiUpdateKeyword,
  apiDeleteKeyword,
  apiCreateProject,
  apiUpdateProject,
  apiDeleteProject,
  apiCreateCategory,
  apiUpdateCategory,
  apiDeleteCategory,
  syncDatabase,
} from "../services/keywordApi";

const getInitialWebsites = () => {
  try {
    const saved = localStorage.getItem("rankpulse_websites");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Error loading websites from localStorage", e);
  }
  return initialWebsites;
};

const getInitialKeywords = () => {
  try {
    const saved = localStorage.getItem("rankpulse_keywords");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Error loading keywords from localStorage", e);
  }
  return initialKeywords;
};

const getInitialProjects = () => {
  try {
    const saved = localStorage.getItem("seo_projects");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Error loading projects from localStorage", e);
  }
  return initialProjects;
};

const getInitialCategories = () => {
  try {
    const saved = localStorage.getItem("seo_categories");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Error loading categories from localStorage", e);
  }
  return initialCategories;
};

const getInitialSelectedWebsiteId = () => {
  try {
    const saved = localStorage.getItem("seo_selected_website_id") || localStorage.getItem("rankpulse_selected_website_id");
    const sites = getInitialWebsites();
    if (saved && sites.some((w) => w.id === saved)) return saved;
    if (sites[0]?.id) return sites[0].id;
  } catch (e) {
    console.error("Error loading selected website from localStorage", e);
  }
  return "site-1";
};

export const useSEOStore = create((set, get) => ({
  websites: getInitialWebsites(),
  selectedWebsiteId: getInitialSelectedWebsiteId(),
  projects: getInitialProjects(),
  activeProjectId: getInitialSelectedWebsiteId(),
  categories: getInitialCategories(),
  keywords: getInitialKeywords(),
  dbStatus: { connected: false, database: null },
  currentUser: JSON.parse(localStorage.getItem("seo-auth-user") || "null"),
  authToken: localStorage.getItem("seo-auth-token") || null,
  dateRange: {
    preset: "last-30-days",
    label: "Last 30 Days",
    startDate: "2026-09-01",
    endDate: "2026-10-01",
  },
  globalSearchQuery: "",

  // Authentication Actions
  setUser: (user, token) => {
    if (user) {
      localStorage.setItem("seo-auth-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("seo-auth-user");
    }
    if (token) {
      localStorage.setItem("seo-auth-token", token);
    } else {
      localStorage.removeItem("seo-auth-token");
    }
    set({ currentUser: user, authToken: token });
  },

  logout: () => {
    localStorage.removeItem("seo-auth-user");
    localStorage.removeItem("seo-auth-token");
    set({ currentUser: null, authToken: null });
  },

  // DB Sync Actions
  loadDbData: async () => {
    try {
      const health = await checkServerHealth();
      set({ dbStatus: health });

      if (health.connected) {
        const data = await fetchDatabaseData();
        if (data) {
          const rawKeywords = data.keywords || [];
          const normalizedKeywords = rawKeywords.map((k) => {
            const history = Array.isArray(k.history) ? k.history : Array.isArray(k.history30d) ? k.history30d : [];
            const monthly = k.monthly || k.monthlyPositions || {};

            let pos = k.position !== undefined && k.position !== null ? Number(k.position) : null;
            if (pos === null || isNaN(pos)) {
              if (monthly["2026-10"] !== undefined && monthly["2026-10"] !== null && !isNaN(Number(monthly["2026-10"]))) {
                pos = Number(monthly["2026-10"]);
              } else if (history.length > 0) {
                pos = Number(history[history.length - 1]);
              }
            }

            let prevPos = k.previousPosition !== undefined && k.previousPosition !== null ? Number(k.previousPosition) : null;
            if (prevPos === null || isNaN(prevPos)) {
              if (monthly["2026-09"] !== undefined && monthly["2026-09"] !== null && !isNaN(Number(monthly["2026-09"]))) {
                prevPos = Number(monthly["2026-09"]);
              }
            }

            const change = prevPos !== null && pos !== null ? prevPos - pos : Number(k.change) || 0;

            return {
              ...k,
              position: pos,
              previousPosition: prevPos,
              change,
              websiteId: k.websiteId || k.projectId || "site-1",
              projectId: k.projectId || "p1",
              history,
              history30d: history,
              monthly,
              monthlyPositions: monthly,
              url: k.url || k.targetUrl || "",
              targetUrl: k.targetUrl || k.url || "",
            };
          });

          if (normalizedKeywords.length > 0) {
            localStorage.setItem("rankpulse_keywords", JSON.stringify(normalizedKeywords));
          }

          const dbProjects = (data.projects || []).filter((p) => !p.deletedAt);
          const currentWebsites = get().websites;

          const loadedWebsites = dbProjects.map((p, idx) => {
            const existing = currentWebsites.find((w) => w.id === p.id || w.domain === p.domain);
            const kwCount = normalizedKeywords.filter(
              (k) => (k.projectId === p.id || k.websiteId === p.id) && !k.deletedAt
            ).length;
            return {
              id: p.id,
              domain: p.domain || p.name.toLowerCase().replace(/\s+/g, '') + '.com',
              projectName: p.name,
              searchEngine: existing?.searchEngine || 'Google US (google.com)',
              country: existing?.country || 'United States',
              countryCode: existing?.countryCode || 'US',
              trackingFrequency: existing?.trackingFrequency || 'Daily',
              createdAt: existing?.createdAt || new Date().toISOString(),
              seoScore: existing?.seoScore || 88,
              organicTraffic: existing?.organicTraffic || 100000,
              trafficChange: existing?.trafficChange || 5.0,
              totalKeywords: kwCount,
              keywordsChange: 0,
              totalBacklinks: existing?.totalBacklinks || 12000,
              backlinksChange: 0,
              referringDomains: existing?.referringDomains || 800,
              domainRating: existing?.domainRating || 65,
              crawlHealth: existing?.crawlHealth || 90,
              device: 'Desktop & Mobile',
              isPrimary: idx === 0,
              assignedTo: existing?.assignedTo || 'usr-admin',
              assignedName: existing?.assignedName || 'Admin'
            };
          });

          if (loadedWebsites.length > 0) {
            localStorage.setItem("rankpulse_websites", JSON.stringify(loadedWebsites));
          }

          // Preserve currently selected project if it exists in the loaded list
          const currentSelected = get().selectedWebsiteId || localStorage.getItem("seo_selected_website_id") || localStorage.getItem("rankpulse_selected_website_id");
          const preservedSelectedId = loadedWebsites.some((w) => w.id === currentSelected)
            ? currentSelected
            : (loadedWebsites[0]?.id || currentSelected || "site-1");

          try {
            if (preservedSelectedId) {
              localStorage.setItem("seo_selected_website_id", preservedSelectedId);
              localStorage.setItem("rankpulse_selected_website_id", preservedSelectedId);
            }
          } catch {}

          set({
            websites: loadedWebsites.length > 0 ? loadedWebsites : get().websites,
            selectedWebsiteId: preservedSelectedId,
            activeProjectId: preservedSelectedId,
            projects: data.projects?.length ? data.projects : get().projects,
            categories: data.categories?.length ? data.categories : get().categories,
            keywords: normalizedKeywords,
          });
        }
      }
    } catch (err) {
      console.warn("Could not load DB data:", err);
    }
  },

  setActiveProjectId: (id) => {
    try {
      localStorage.setItem("seo_selected_website_id", id);
      localStorage.setItem("rankpulse_selected_website_id", id);
    } catch {}
    set({ activeProjectId: id, selectedWebsiteId: id });
  },

  // Website Actions
  setSelectedWebsiteId: (id) => {
    try {
      localStorage.setItem("seo_selected_website_id", id);
      localStorage.setItem("rankpulse_selected_website_id", id);
    } catch {}
    set({ selectedWebsiteId: id, activeProjectId: id });
  },

  getSelectedWebsite: () => {
    const { websites, selectedWebsiteId } = get();
    return websites.find((w) => w.id === selectedWebsiteId) || websites[0];
  },

  addWebsite: async (newSite) => {
    const id = `p_${Date.now().toString(36)}`;
    const cleanDomain = newSite.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const website = {
      id,
      domain: cleanDomain,
      projectName: newSite.projectName || cleanDomain,
      searchEngine: newSite.searchEngine || "Google US (google.com)",
      country: newSite.country || "United States",
      countryCode: newSite.countryCode || "US",
      trackingFrequency: newSite.trackingFrequency || "Daily",
      createdAt: new Date().toISOString(),
      seoScore: 85,
      organicTraffic: 10000,
      trafficChange: 0,
      totalKeywords: 0,
      keywordsChange: 0,
      totalBacklinks: 0,
      backlinksChange: 0,
      referringDomains: 0,
      domainRating: 50,
      crawlHealth: 90,
      device: newSite.device || "Desktop & Mobile",
      isPrimary: false,
      assignedTo: newSite.assignedTo || 'usr-admin',
      assignedName: newSite.assignedName || 'Admin'
    };

    const newProj = {
      id,
      name: website.projectName,
      domain: website.domain,
      deletedAt: null,
      deletedWith: null,
    };

    set((state) => {
      const updatedWebsites = [...state.websites, website];
      const updatedProjects = [...state.projects, newProj];
      localStorage.setItem("rankpulse_websites", JSON.stringify(updatedWebsites));
      localStorage.setItem("seo_projects", JSON.stringify(updatedProjects));
      return {
        websites: updatedWebsites,
        projects: updatedProjects,
        selectedWebsiteId: id,
        activeProjectId: id,
      };
    });

    await apiCreateProject(newProj);
    return website;
  },

  assignWebsite: (websiteId, userId, userName) => {
    set((state) => {
      const updated = state.websites.map((w) =>
        w.id === websiteId ? { ...w, assignedTo: userId, assignedName: userName } : w
      );
      localStorage.setItem("rankpulse_websites", JSON.stringify(updated));
      return { websites: updated };
    });
  },

  updateWebsite: async (id, updates) => {
    set((state) => {
      const updated = state.websites.map((w) => (w.id === id ? { ...w, ...updates } : w));
      localStorage.setItem("rankpulse_websites", JSON.stringify(updated));
      return { websites: updated };
    });

    if (updates.projectName || updates.domain) {
      await apiUpdateProject(id, {
        name: updates.projectName,
        domain: updates.domain,
      });
    }
  },

  deleteWebsite: async (id) => {
    set((state) => {
      const updatedWebsites = state.websites.filter((w) => w.id !== id);
      const nextSelected = updatedWebsites[0]?.id || "";
      localStorage.setItem("rankpulse_websites", JSON.stringify(updatedWebsites));

      // Also cleanup associated keywords
      const updatedKeywords = state.keywords.filter((k) => k.websiteId !== id && k.projectId !== id);
      localStorage.setItem("rankpulse_keywords", JSON.stringify(updatedKeywords));

      const updatedProjects = state.projects.filter((p) => p.id !== id);
      localStorage.setItem("seo_projects", JSON.stringify(updatedProjects));

      return {
        websites: updatedWebsites,
        projects: updatedProjects,
        selectedWebsiteId: nextSelected,
        activeProjectId: nextSelected,
        keywords: updatedKeywords,
      };
    });

    await apiDeleteProject(id);
  },

  // Project Actions (Soft Delete & Restore)
  addProject: async (project) => {
    const newProj = {
      id: project.id || `p_${Date.now()}`,
      name: project.name,
      domain: project.domain || "",
      deletedAt: null,
      deletedWith: null,
    };
    set((state) => {
      const updated = [...state.projects, newProj];
      localStorage.setItem("seo_projects", JSON.stringify(updated));
      return { projects: updated, activeProjectId: newProj.id };
    });
    await apiCreateProject(newProj);
    return newProj;
  },

  softDeleteProject: async (id) => {
    const deletedAt = new Date().toISOString();
    set((state) => {
      const updatedProjects = state.projects.map((p) => (p.id === id ? { ...p, deletedAt } : p));
      const updatedCategories = state.categories.map((c) =>
        c.projectId === id && !c.deletedAt ? { ...c, deletedAt, deletedWith: id } : c
      );
      const updatedKeywords = state.keywords.map((k) =>
        (k.projectId === id || k.websiteId === id) && !k.deletedAt
          ? { ...k, deletedAt, deletedWith: id }
          : k
      );

      localStorage.setItem("seo_projects", JSON.stringify(updatedProjects));
      localStorage.setItem("seo_categories", JSON.stringify(updatedCategories));
      localStorage.setItem("rankpulse_keywords", JSON.stringify(updatedKeywords));

      const nextActive = updatedProjects.find((p) => !p.deletedAt)?.id || "";
      return {
        projects: updatedProjects,
        categories: updatedCategories,
        keywords: updatedKeywords,
        activeProjectId: nextActive,
      };
    });
    await apiUpdateProject(id, { deletedAt });
  },

  restoreProject: async (rawId) => {
    const id = typeof rawId === "object" && rawId !== null ? rawId.id : rawId;
    set((state) => {
      const updatedProjects = state.projects.map((p) =>
        p.id === id ? { ...p, deletedAt: null, deletedWith: null } : p
      );
      const updatedCategories = state.categories.map((c) =>
        c.deletedWith === id ? { ...c, deletedAt: null, deletedWith: null } : c
      );
      const updatedKeywords = state.keywords.map((k) =>
        k.deletedWith === id ? { ...k, deletedAt: null, deletedWith: null } : k
      );

      localStorage.setItem("seo_projects", JSON.stringify(updatedProjects));
      localStorage.setItem("seo_categories", JSON.stringify(updatedCategories));
      localStorage.setItem("rankpulse_keywords", JSON.stringify(updatedKeywords));

      return {
        projects: updatedProjects,
        categories: updatedCategories,
        keywords: updatedKeywords,
        activeProjectId: id,
      };
    });
    await apiUpdateProject(id, { deletedAt: null, deletedWith: null });
  },

  purgeProject: async (rawId) => {
    const id = typeof rawId === "object" && rawId !== null ? rawId.id : rawId;
    set((state) => {
      const updatedProjects = state.projects.filter((p) => p.id !== id);
      const updatedCategories = state.categories.filter((c) => c.projectId !== id && c.deletedWith !== id);
      const updatedKeywords = state.keywords.filter((k) => k.projectId !== id && k.deletedWith !== id && k.websiteId !== id);

      localStorage.setItem("seo_projects", JSON.stringify(updatedProjects));
      localStorage.setItem("seo_categories", JSON.stringify(updatedCategories));
      localStorage.setItem("rankpulse_keywords", JSON.stringify(updatedKeywords));

      return {
        projects: updatedProjects,
        categories: updatedCategories,
        keywords: updatedKeywords,
      };
    });
    await apiDeleteProject(id);
  },

  // Category Actions (Soft Delete & Restore)
  addCategory: async (category) => {
    const newCat = {
      id: category.id || `cat_${Date.now()}`,
      name: category.name,
      projectId: category.projectId || get().activeProjectId,
      deletedAt: null,
      deletedWith: null,
    };
    set((state) => {
      const updated = [...state.categories, newCat];
      localStorage.setItem("seo_categories", JSON.stringify(updated));
      return { categories: updated };
    });
    await apiCreateCategory(newCat);
    return newCat;
  },

  softDeleteCategory: async (rawId, choice = "cascade") => {
    const id = typeof rawId === "object" && rawId !== null ? rawId.id : rawId;
    const deletedAt = new Date().toISOString();
    const cat = get().categories.find((c) => c.id === id);
    const catName = cat?.name || "";

    set((state) => {
      const updatedCategories = state.categories.map((c) => (c.id === id ? { ...c, deletedAt } : c));
      let updatedKeywords = state.keywords;

      if (choice === "cascade") {
        updatedKeywords = state.keywords.map((k) =>
          k.group === catName && !k.deletedAt ? { ...k, deletedAt, deletedWith: id } : k
        );
      } else {
        // Uncategorize
        updatedKeywords = state.keywords.map((k) =>
          k.group === catName ? { ...k, group: "Uncategorized" } : k
        );
      }

      localStorage.setItem("seo_categories", JSON.stringify(updatedCategories));
      localStorage.setItem("rankpulse_keywords", JSON.stringify(updatedKeywords));

      return {
        categories: updatedCategories,
        keywords: updatedKeywords,
      };
    });

    await apiUpdateCategory(id, { deletedAt });
  },

  restoreCategory: async (rawId) => {
    const id = typeof rawId === "object" && rawId !== null ? rawId.id : rawId;
    const cat = get().categories.find((c) => c.id === id);
    const projId = cat?.projectId;
    const proj = get().projects.find((p) => p.id === projId);

    set((state) => {
      let updatedProjects = state.projects;
      if (proj && proj.deletedAt) {
        updatedProjects = state.projects.map((p) =>
          p.id === projId ? { ...p, deletedAt: null, deletedWith: null } : p
        );
      }

      const updatedCategories = state.categories.map((c) =>
        c.id === id ? { ...c, deletedAt: null, deletedWith: null } : c
      );
      const updatedKeywords = state.keywords.map((k) =>
        k.deletedWith === id ? { ...k, deletedAt: null, deletedWith: null } : k
      );

      localStorage.setItem("seo_projects", JSON.stringify(updatedProjects));
      localStorage.setItem("seo_categories", JSON.stringify(updatedCategories));
      localStorage.setItem("rankpulse_keywords", JSON.stringify(updatedKeywords));

      return {
        projects: updatedProjects,
        categories: updatedCategories,
        keywords: updatedKeywords,
      };
    });

    await apiUpdateCategory(id, { deletedAt: null, deletedWith: null });
    if (proj && proj.deletedAt) {
      await apiUpdateProject(projId, { deletedAt: null, deletedWith: null });
    }
  },

  purgeCategory: async (rawId) => {
    const id = typeof rawId === "object" && rawId !== null ? rawId.id : rawId;
    set((state) => {
      const updatedCategories = state.categories.filter((c) => c.id !== id);
      const updatedKeywords = state.keywords.filter((k) => k.deletedWith !== id);

      localStorage.setItem("seo_categories", JSON.stringify(updatedCategories));
      localStorage.setItem("rankpulse_keywords", JSON.stringify(updatedKeywords));

      return {
        categories: updatedCategories,
        keywords: updatedKeywords,
      };
    });
    await apiDeleteCategory(id);
  },

  // Keyword Actions
  addKeyword: async (keywordData) => {
    const { selectedWebsiteId, activeProjectId, keywords } = get();
    const normalizedQuery = keywordData.keyword.trim().toLowerCase();
    const dev = keywordData.device || "desktop";
    const loc = keywordData.location || "United States";

    // Duplicate check
    const duplicate = keywords.find(
      (k) =>
        (k.websiteId === selectedWebsiteId || k.projectId === activeProjectId) &&
        k.keyword.trim().toLowerCase() === normalizedQuery &&
        !k.deletedAt &&
        k.device === dev &&
        k.location?.toLowerCase() === loc.toLowerCase()
    );

    if (duplicate) {
      throw new Error(`Keyword "${keywordData.keyword}" is already tracked for ${dev} in ${loc}.`);
    }

    const position = keywordData.notRanking ? null : Number(keywordData.position);
    const volume = Number(keywordData.volume) >= 0 ? Number(keywordData.volume) : 0;

    // Clean monthly positions
    const cleanMonthly = {};
    if (position !== null && !isNaN(position)) {
      cleanMonthly["2026-10"] = position;
    }

    if (keywordData.monthlyPositions && typeof keywordData.monthlyPositions === "object") {
      Object.entries(keywordData.monthlyPositions).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined && !isNaN(Number(v))) {
          cleanMonthly[k] = Number(v);
        }
      });
    }

    const prevMonthPos = cleanMonthly["2026-09"] !== undefined ? cleanMonthly["2026-09"] : null;
    const change = prevMonthPos !== null && position !== null ? prevMonthPos - position : null;
    const history30d = position !== null ? [position] : [];

    const numericMonthly = Object.values(cleanMonthly).filter((n) => typeof n === "number" && !isNaN(n));
    const bestPosition = numericMonthly.length > 0 ? Math.min(...numericMonthly) : position || null;
    const worstPosition = numericMonthly.length > 0 ? Math.max(...numericMonthly) : position || null;

    const newKeyword = {
      id: keywordData.id || `kw-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      websiteId: selectedWebsiteId,
      projectId: activeProjectId,
      keyword: keywordData.keyword.trim(),
      position,
      previousPosition: prevMonthPos,
      change,
      volume,
      difficulty: Number(keywordData.difficulty) || Math.floor(Math.random() * 40) + 30,
      cpc: Number(keywordData.cpc) || +(Math.random() * 8 + 2).toFixed(2),
      targetUrl: keywordData.targetUrl || keywordData.url || `https://${get().getSelectedWebsite()?.domain || "example.com"}/`,
      url: keywordData.url || keywordData.targetUrl || `https://${get().getSelectedWebsite()?.domain || "example.com"}/`,
      group: keywordData.group || "Core SaaS",
      device: dev,
      searchEngine: keywordData.searchEngine || "Google",
      location: loc,
      serpFeatures: keywordData.serpFeatures || ["Featured Snippet", "People Also Ask"],
      createdAt: new Date().toISOString(),
      trackingStartDate: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toISOString().split("T")[0],
      bestPosition,
      worstPosition,
      history30d,
      history: history30d,
      monthlyPositions: cleanMonthly,
      monthly: cleanMonthly,
      isNew: true,
      deletedAt: null,
      deletedWith: null,
    };

    set((state) => {
      const updated = [newKeyword, ...state.keywords];
      localStorage.setItem("rankpulse_keywords", JSON.stringify(updated));
      return { keywords: updated };
    });

    await apiCreateKeyword(newKeyword);
    return newKeyword;
  },

  bulkAddKeywords: async (keywordsList, defaults = {}) => {
    const { selectedWebsiteId, activeProjectId } = get();
    const targetSiteId = selectedWebsiteId || activeProjectId || get().getSelectedWebsite()?.id || 'site-1';

    const createdKeywords = keywordsList.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        const kwText = String(item.keyword || item.name || '').trim();
        const position = item.position !== undefined && item.position !== null && !isNaN(Number(item.position))
          ? Number(item.position)
          : Math.floor(Math.random() * 30) + 1;

        const history30d = Array.isArray(item.history) && item.history.length > 0
          ? item.history
          : Array.from({ length: 30 }, () => Math.max(1, Math.min(100, Math.round(position + (Math.random() - 0.5) * 5))));
        if (history30d.length > 0) history30d[history30d.length - 1] = position;

        const monthlyPositions = item.monthly || item.monthlyPositions || {
          "2026-05": position + 7,
          "2026-06": position + 5,
          "2026-07": position + 3,
          "2026-08": position + 2,
          "2026-09": position + 1,
          "2026-10": position,
        };

        const targetUrlVal = item.url || item.targetUrl || defaults.url || defaults.targetUrl || `https://${get().getSelectedWebsite()?.domain || "example.com"}/`;

        return {
          id: item.id || `kw-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          websiteId: item.websiteId || targetSiteId,
          projectId: item.projectId || targetSiteId,
          keyword: kwText,
          position,
          previousPosition: item.previousPosition !== undefined && item.previousPosition !== null && !isNaN(Number(item.previousPosition))
            ? Number(item.previousPosition)
            : (position + (Math.floor(Math.random() * 5) - 2)),
          change: item.change !== undefined ? Number(item.change) : 0,
          volume: item.volume !== undefined && !isNaN(Number(item.volume))
            ? Number(item.volume)
            : (Math.floor(Math.random() * 12000) + 1000),
          difficulty: item.difficulty !== undefined && !isNaN(Number(item.difficulty))
            ? Number(item.difficulty)
            : (Math.floor(Math.random() * 70) + 15),
          cpc: item.cpc !== undefined && !isNaN(Number(item.cpc))
            ? Number(item.cpc)
            : +(Math.random() * 12 + 2).toFixed(2),
          targetUrl: targetUrlVal,
          url: targetUrlVal,
          group: item.group || item.category || defaults.group || "Core Features",
          device: item.device || defaults.device || "desktop",
          location: item.location || defaults.location || "United States",
          serpFeatures: item.serpFeatures || ["People Also Ask", "SiteLinks"],
          lastUpdated: item.lastUpdated || new Date().toISOString().split("T")[0],
          bestPosition: item.bestPosition || Math.max(1, position - 3),
          worstPosition: item.worstPosition || position + 10,
          history30d,
          history: history30d,
          monthlyPositions,
          monthly: monthlyPositions,
          deletedAt: null,
          deletedWith: null,
        };
      }

      const kwText = String(item || '').trim();
      const position = Math.floor(Math.random() * 30) + 1;
      const history30d = Array.from({ length: 30 }, () =>
        Math.max(1, Math.min(100, Math.round(position + (Math.random() - 0.5) * 5)))
      );
      history30d[history30d.length - 1] = position;

      const targetUrlVal = defaults.targetUrl || defaults.url || `https://${get().getSelectedWebsite()?.domain || "example.com"}/`;

      return {
        id: `kw-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        websiteId: targetSiteId,
        projectId: targetSiteId,
        keyword: kwText,
        position,
        previousPosition: position + (Math.floor(Math.random() * 5) - 2),
        change: 0,
        volume: Math.floor(Math.random() * 12000) + 1000,
        difficulty: Math.floor(Math.random() * 70) + 15,
        cpc: +(Math.random() * 12 + 2).toFixed(2),
        targetUrl: targetUrlVal,
        url: targetUrlVal,
        group: defaults.group || "Core SaaS",
        device: defaults.device || "desktop",
        location: defaults.location || "United States",
        serpFeatures: ["People Also Ask", "SiteLinks"],
        lastUpdated: new Date().toISOString().split("T")[0],
        bestPosition: Math.max(1, position - 3),
        worstPosition: position + 10,
        history30d,
        history: history30d,
        monthlyPositions: {
          "2026-05": position + 7,
          "2026-06": position + 5,
          "2026-07": position + 3,
          "2026-08": position + 2,
          "2026-09": position + 1,
          "2026-10": position,
        },
        monthly: {
          "2026-05": position + 7,
          "2026-06": position + 5,
          "2026-07": position + 3,
          "2026-08": position + 2,
          "2026-09": position + 1,
          "2026-10": position,
        },
        deletedAt: null,
        deletedWith: null,
      };
    });

    createdKeywords.forEach((k) => {
      if (k.previousPosition !== undefined && k.position !== undefined) {
        k.change = k.previousPosition - k.position;
      }
    });

    set((state) => {
      const updated = [...createdKeywords, ...state.keywords];
      localStorage.setItem("rankpulse_keywords", JSON.stringify(updated));
      return { keywords: updated };
    });

    for (const kw of createdKeywords) {
      try {
        await apiCreateKeyword(kw);
      } catch (err) {
        console.warn("apiCreateKeyword error:", err);
      }
    }

    return createdKeywords;
  },

  softDeleteKeyword: async (rawId) => {
    const id = typeof rawId === "object" && rawId !== null ? rawId.id : rawId;
    const deletedAt = new Date().toISOString();
    set((state) => {
      const updated = state.keywords.map((k) => (k.id === id ? { ...k, deletedAt } : k));
      localStorage.setItem("rankpulse_keywords", JSON.stringify(updated));
      return { keywords: updated };
    });
    await apiUpdateKeyword(id, { deletedAt });
  },

  restoreKeyword: async (rawId) => {
    const id = typeof rawId === "object" && rawId !== null ? rawId.id : rawId;
    const kw = get().keywords.find((k) => k.id === id);
    const catName = kw?.group;
    const cat = get().categories.find((c) => c.name === catName && c.projectId === (kw?.projectId || get().activeProjectId));

    set((state) => {
      let updatedCategories = state.categories;
      if (cat && cat.deletedAt) {
        updatedCategories = state.categories.map((c) =>
          c.id === cat.id ? { ...c, deletedAt: null, deletedWith: null } : c
        );
      }

      const updated = state.keywords.map((k) =>
        k.id === id ? { ...k, deletedAt: null, deletedWith: null } : k
      );

      localStorage.setItem("seo_categories", JSON.stringify(updatedCategories));
      localStorage.setItem("rankpulse_keywords", JSON.stringify(updated));

      return {
        categories: updatedCategories,
        keywords: updated,
      };
    });

    await apiUpdateKeyword(id, { deletedAt: null, deletedWith: null });
    if (cat && cat.deletedAt) {
      await apiUpdateCategory(cat.id, { deletedAt: null, deletedWith: null });
    }
  },

  purgeKeyword: async (rawId) => {
    const id = typeof rawId === "object" && rawId !== null ? rawId.id : rawId;
    set((state) => {
      const updated = state.keywords.filter((k) => k.id !== id);
      localStorage.setItem("rankpulse_keywords", JSON.stringify(updated));
      return { keywords: updated };
    });
    await apiDeleteKeyword(id);
  },

  deleteKeyword: async (rawId) => {
    // Delegates to soft delete for safety
    await get().softDeleteKeyword(rawId);
  },

  emptyTrash: async () => {
    const trashedKeywords = get().keywords.filter((k) => k.deletedAt);
    const trashedCategories = get().categories.filter((c) => c.deletedAt);
    const trashedProjects = get().projects.filter((p) => p.deletedAt);

    set((state) => {
      const updatedKeywords = state.keywords.filter((k) => !k.deletedAt);
      const updatedCategories = state.categories.filter((c) => !c.deletedAt);
      const updatedProjects = state.projects.filter((p) => !p.deletedAt);

      localStorage.setItem("rankpulse_keywords", JSON.stringify(updatedKeywords));
      localStorage.setItem("seo_categories", JSON.stringify(updatedCategories));
      localStorage.setItem("seo_projects", JSON.stringify(updatedProjects));

      return {
        keywords: updatedKeywords,
        categories: updatedCategories,
        projects: updatedProjects,
      };
    });

    for (const k of trashedKeywords) await apiDeleteKeyword(k.id);
    for (const c of trashedCategories) await apiDeleteCategory(c.id);
    for (const p of trashedProjects) await apiDeleteProject(p.id);
  },

  updateKeyword: async (keywordId, partialData) => {
    set((state) => {
      const updated = state.keywords.map((k) => {
        if (k.id === keywordId) {
          const merged = { ...k, ...partialData };
          if (partialData.monthlyPositions || partialData.monthly) {
            const mData = partialData.monthlyPositions || partialData.monthly;
            const mEntries = Object.values(mData).map(Number).filter((n) => !isNaN(n) && n > 0);
            if (mEntries.length > 0) {
              merged.bestPosition = Math.min(...mEntries);
              merged.worstPosition = Math.max(...mEntries);
            }
            if (mData["2026-10"] !== undefined) {
              merged.position = Number(mData["2026-10"]) || merged.position;
            }
            if (mData["2026-09"] !== undefined) {
              merged.previousPosition = Number(mData["2026-09"]) || merged.previousPosition;
            }
            merged.change = (merged.previousPosition || merged.position) - merged.position;
            merged.monthly = mData;
            merged.monthlyPositions = mData;
          }
          if (partialData.position !== undefined) {
            merged.position = Number(partialData.position) || 1;
            merged.change = (merged.previousPosition || merged.position) - merged.position;
          }
          if (partialData.volume !== undefined) {
            merged.volume = Number(partialData.volume) || 0;
          }
          merged.lastUpdated = new Date().toISOString().split("T")[0];
          return merged;
        }
        return k;
      });
      localStorage.setItem("rankpulse_keywords", JSON.stringify(updated));
      return { keywords: updated };
    });

    await apiUpdateKeyword(keywordId, partialData);
  },

  updateMonthlyPosition: async (keywordId, monthKey, newPosition) => {
    const val = Math.max(1, Math.min(100, Number(newPosition) || 1));
    let updatedMonthlyObj = {};

    set((state) => {
      const updated = state.keywords.map((k) => {
        if (k.id === keywordId) {
          const updatedMonthly = { ...(k.monthlyPositions || k.monthly || {}), [monthKey]: val };
          updatedMonthlyObj = updatedMonthly;
          const mEntries = Object.values(updatedMonthly).map(Number).filter((n) => !isNaN(n) && n > 0);
          const bestPos = mEntries.length > 0 ? Math.min(...mEntries) : k.bestPosition;
          const worstPos = mEntries.length > 0 ? Math.max(...mEntries) : k.worstPosition;

          let newCurrentPos = k.position;
          let newPrevPos = k.previousPosition;

          if (monthKey === "2026-10") {
            newCurrentPos = val;
          }
          if (monthKey === "2026-09") {
            newPrevPos = val;
          }

          const change = newPrevPos - newCurrentPos;

          // Update latest 30-day history
          const newHistory = [...(k.history30d || k.history || [])];
          if (newHistory.length > 0) {
            newHistory[newHistory.length - 1] = newCurrentPos;
          }

          return {
            ...k,
            monthlyPositions: updatedMonthly,
            monthly: updatedMonthly,
            position: newCurrentPos,
            previousPosition: newPrevPos,
            change,
            bestPosition: bestPos,
            worstPosition: worstPos,
            history30d: newHistory,
            history: newHistory,
            lastUpdated: new Date().toISOString().split("T")[0],
          };
        }
        return k;
      });
      localStorage.setItem("rankpulse_keywords", JSON.stringify(updated));
      return { keywords: updated };
    });

    await apiUpdateKeyword(keywordId, { monthly: updatedMonthlyObj });
  },

  setDateRange: (range) => set({ dateRange: range }),
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
}));

// Alias for convenience
export const useSeoStore = useSEOStore;
