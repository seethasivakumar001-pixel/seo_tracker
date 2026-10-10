import { create } from 'zustand';
import {
  getAllBacklinks,
  saveAllBacklinks,
  mockVerifyLink,
  checkDuplicateBacklink
} from '../services/backlinkService';
import {
  apiFetchBacklinks,
  apiCreateBacklink,
  apiUpdateBacklink,
  apiDeleteBacklink,
  apiBulkCreateBacklinks
} from '../services/keywordApi';

const getInitialLogs = () => {
  try {
    const saved = localStorage.getItem('seo_backlink_activity_logs');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

export const useBacklinkStore = create((set, get) => ({
  backlinks: getAllBacklinks(),
  activityLogs: getInitialLogs(),
  isLoading: false,

  // Fetch from DB on load
  fetchDbBacklinks: async (projectId = null) => {
    try {
      set({ isLoading: true });
      const dbLinks = await apiFetchBacklinks(projectId);
      if (Array.isArray(dbLinks)) {
        set({ backlinks: dbLinks });
        saveAllBacklinks(dbLinks);
      }
    } catch (err) {
      console.warn('Could not fetch backlinks from DB, using cache:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Helper to log activities
  logActivity: (action, details) => {
    const newLog = {
      id: `log-${Date.now()}`,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    set((state) => {
      const updatedLogs = [newLog, ...state.activityLogs].slice(0, 50);
      try {
        localStorage.setItem('seo_backlink_activity_logs', JSON.stringify(updatedLogs));
      } catch {}
      return { activityLogs: updatedLogs };
    });
  },

  // Add Backlink
  addBacklink: async (backlinkData) => {
    const { websiteUrl, submittedUrl, projectId } = backlinkData;
    const dupCheck = checkDuplicateBacklink(websiteUrl, submittedUrl, projectId);

    if (dupCheck.isDuplicate) {
      throw new Error(`This backlink (${websiteUrl}) is already recorded for this project.`);
    }

    const newBacklink = {
      id: `bl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      projectId: projectId || 'site-1',
      websiteName: backlinkData.websiteName?.trim() || 'Web Link',
      websiteUrl: backlinkData.websiteUrl?.trim(),
      submittedUrl: backlinkData.submittedUrl?.trim(),
      status: backlinkData.status || 'Undone',
      type: backlinkData.type || 'Directory',
      anchorText: backlinkData.anchorText?.trim() || '',
      linkAttribute: backlinkData.linkAttribute || 'Dofollow',
      domainRating: Number(backlinkData.domainRating) || Math.floor(Math.random() * 40) + 50,
      spamScore: Number(backlinkData.spamScore) || Math.floor(Math.random() * 4) + 1,
      trafficEstimate: backlinkData.trafficEstimate || `${(Math.random() * 8 + 1).toFixed(1)}M`,
      verificationStatus: backlinkData.status === 'Done' ? 'Live' : 'Pending',
      lastChecked: backlinkData.status === 'Done' ? new Date().toISOString().split('T')[0] : null,
      dateSubmitted: backlinkData.dateSubmitted || new Date().toISOString().split('T')[0],
      dateVerified: backlinkData.status === 'Done' ? new Date().toISOString().split('T')[0] : null,
      notes: backlinkData.notes || '',
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date().toISOString()
    };

    set((state) => {
      const updated = [newBacklink, ...state.backlinks];
      saveAllBacklinks(updated);
      return { backlinks: updated };
    });

    get().logActivity('Add Backlink', `Created backlink for ${newBacklink.websiteName}`);
    await apiCreateBacklink(newBacklink);
    return newBacklink;
  },

  // Update Backlink
  updateBacklink: async (id, updates) => {
    set((state) => {
      const updated = state.backlinks.map((b) => (b.id === id ? { ...b, ...updates } : b));
      saveAllBacklinks(updated);
      return { backlinks: updated };
    });
    get().logActivity('Edit Backlink', `Updated backlink ID: ${id}`);
    await apiUpdateBacklink(id, updates);
  },

  // Toggle Status (Done <-> Undone)
  toggleBacklinkStatus: async (id) => {
    let newStatus = 'Undone';
    let targetName = '';
    let payload = {};

    set((state) => {
      const updated = state.backlinks.map((b) => {
        if (b.id === id) {
          newStatus = b.status === 'Done' ? 'Undone' : 'Done';
          targetName = b.websiteName;
          payload = {
            status: newStatus,
            dateVerified: newStatus === 'Done' ? new Date().toISOString().split('T')[0] : b.dateVerified,
            verificationStatus: newStatus === 'Done' ? 'Live' : b.verificationStatus
          };
          return {
            ...b,
            ...payload
          };
        }
        return b;
      });
      saveAllBacklinks(updated);
      return { backlinks: updated };
    });

    get().logActivity('Status Toggle', `Toggled ${targetName} to ${newStatus}`);
    await apiUpdateBacklink(id, payload);
    return newStatus;
  },

  // Link Verification Check
  verifyBacklink: async (id) => {
    let result = null;
    let targetName = '';

    set((state) => {
      const updated = state.backlinks.map((b) => {
        if (b.id === id) {
          result = mockVerifyLink(b);
          targetName = b.websiteName;
          return { ...b, ...result };
        }
        return b;
      });
      saveAllBacklinks(updated);
      return { backlinks: updated };
    });

    if (result) {
      get().logActivity('Link Verification', `Checked ${targetName}: ${result.verificationStatus}`);
      await apiUpdateBacklink(id, result);
    }
    return result;
  },

  // Verify All Links in Project
  verifyAllProjectBacklinks: async (projectId) => {
    const toUpdate = [];
    set((state) => {
      const updated = state.backlinks.map((b) => {
        const matchProject = b.projectId === projectId || (projectId === 'p1' && b.projectId === 'site-1') || (projectId === 'site-1' && b.projectId === 'p1');
        if (matchProject && !b.deletedAt) {
          const res = mockVerifyLink(b);
          toUpdate.push({ id: b.id, res });
          return { ...b, ...res };
        }
        return b;
      });
      saveAllBacklinks(updated);
      return { backlinks: updated };
    });
    get().logActivity('Batch Verification', `Verified all backlinks for project ${projectId}`);
    for (const item of toUpdate) {
      await apiUpdateBacklink(item.id, item.res);
    }
  },

  // Soft Delete to Trash
  softDeleteBacklink: async (rawId) => {
    const id = typeof rawId === 'object' && rawId !== null ? rawId.id : rawId;
    const deletedAt = new Date().toISOString();
    let targetName = '';

    set((state) => {
      const updated = state.backlinks.map((b) => {
        if (b.id === id) {
          targetName = b.websiteName;
          return { ...b, isDeleted: true, deletedAt };
        }
        return b;
      });
      saveAllBacklinks(updated);
      return { backlinks: updated };
    });

    get().logActivity('Soft Delete', `Moved ${targetName} to Trash`);
    await apiDeleteBacklink(id);
  },

  // Restore from Trash
  restoreBacklink: async (rawId) => {
    const id = typeof rawId === 'object' && rawId !== null ? rawId.id : rawId;
    let targetName = '';
    set((state) => {
      const updated = state.backlinks.map((b) => {
        if (b.id === id) {
          targetName = b.websiteName;
          return { ...b, isDeleted: false, deletedAt: null };
        }
        return b;
      });
      saveAllBacklinks(updated);
      return { backlinks: updated };
    });
    get().logActivity('Restore Backlink', `Restored ${targetName} from Trash`);
    await apiUpdateBacklink(id, { deletedAt: null });
  },

  // Permanent Purge
  purgeBacklink: async (rawId) => {
    const id = typeof rawId === 'object' && rawId !== null ? rawId.id : rawId;
    set((state) => {
      const updated = state.backlinks.filter((b) => b.id !== id);
      saveAllBacklinks(updated);
      return { backlinks: updated };
    });
    get().logActivity('Permanent Purge', `Permanently deleted backlink ID: ${id}`);
    await apiDeleteBacklink(id);
  },

  // Bulk Actions
  bulkUpdateStatus: async (ids, status) => {
    set((state) => {
      const updated = state.backlinks.map((b) =>
        ids.includes(b.id) ? { ...b, status, verificationStatus: status === 'Done' ? 'Live' : b.verificationStatus } : b
      );
      saveAllBacklinks(updated);
      return { backlinks: updated };
    });
    get().logActivity('Bulk Status Update', `Marked ${ids.length} backlinks as ${status}`);
    for (const id of ids) {
      await apiUpdateBacklink(id, { status, verificationStatus: status === 'Done' ? 'Live' : 'Pending' });
    }
  },

  bulkDeleteBacklinks: async (ids) => {
    const deletedAt = new Date().toISOString();
    set((state) => {
      const updated = state.backlinks.map((b) =>
        ids.includes(b.id) ? { ...b, isDeleted: true, deletedAt } : b
      );
      saveAllBacklinks(updated);
      return { backlinks: updated };
    });
    get().logActivity('Bulk Soft Delete', `Moved ${ids.length} backlinks to Trash`);
    for (const id of ids) {
      await apiDeleteBacklink(id);
    }
  },

  bulkImportBacklinks: async (newItems) => {
    const formatted = newItems.map((item, idx) => ({
      id: `bl-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      projectId: item.projectId || 'site-1',
      websiteName: item.websiteName || 'Web Link',
      websiteUrl: item.websiteUrl,
      submittedUrl: item.submittedUrl,
      status: item.status || 'Undone',
      type: item.type || 'Directory',
      anchorText: item.anchorText || '',
      linkAttribute: item.linkAttribute || 'Dofollow',
      domainRating: item.domainRating || Math.floor(Math.random() * 40) + 50,
      spamScore: item.spamScore || Math.floor(Math.random() * 4) + 1,
      trafficEstimate: item.trafficEstimate || `${(Math.random() * 8 + 1).toFixed(1)}M`,
      verificationStatus: item.status === 'Done' ? 'Live' : 'Pending',
      lastChecked: item.status === 'Done' ? new Date().toISOString().split('T')[0] : null,
      dateSubmitted: item.dateSubmitted || new Date().toISOString().split('T')[0],
      dateVerified: item.status === 'Done' ? new Date().toISOString().split('T')[0] : null,
      notes: item.notes || 'Imported via batch tool',
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date().toISOString()
    }));

    set((state) => {
      const updated = [...formatted, ...state.backlinks];
      saveAllBacklinks(updated);
      return { backlinks: updated };
    });

    get().logActivity('Bulk Import', `Imported ${formatted.length} new backlinks`);
    await apiBulkCreateBacklinks(formatted);
    return formatted;
  },

  // Project Summary Calculator
  getProjectSummary: (projectId) => {
    const { backlinks } = get();
    const projectLinks = backlinks.filter((b) => {
      const matchProject = b.projectId === projectId || (projectId === 'p1' && b.projectId === 'site-1') || (projectId === 'site-1' && b.projectId === 'p1') || (projectId === 'p2' && b.projectId === 'site-2') || (projectId === 'site-2' && b.projectId === 'p2');
      return matchProject && !b.deletedAt;
    });

    const total = projectLinks.length;
    const done = projectLinks.filter((b) => b.status === 'Done').length;
    const undone = total - done;
    const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;
    const liveCount = projectLinks.filter((b) => b.verificationStatus === 'Live').length;
    const brokenCount = projectLinks.filter((b) => b.verificationStatus === 'Broken').length;
    const pendingCount = projectLinks.filter((b) => b.verificationStatus === 'Pending').length;

    return {
      total,
      done,
      undone,
      completionPct,
      liveCount,
      brokenCount,
      pendingCount
    };
  }
}));
