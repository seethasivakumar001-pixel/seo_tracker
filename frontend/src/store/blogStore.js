import { create } from 'zustand';
import {
  apiFetchBlogs,
  apiCreateBlog,
  apiUpdateBlog,
  apiDeleteBlog,
  apiRestoreBlog
} from '../services/keywordApi';

const getStoredBlogs = () => {
  try {
    const saved = localStorage.getItem('seo_blogs');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading seo_blogs from localStorage:', e);
  }
  return [];
};

export const useBlogStore = create((set, get) => ({
  blogs: getStoredBlogs(),
  isLoading: false,

  setBlogs: (newBlogs) => {
    if (Array.isArray(newBlogs)) {
      set({ blogs: newBlogs });
      try {
        localStorage.setItem('seo_blogs', JSON.stringify(newBlogs));
      } catch {}
    }
  },

  fetchDbBlogs: async (projectId = null, domain = null) => {
    try {
      set({ isLoading: true });
      const dbBlogs = await apiFetchBlogs(projectId, domain);
      if (Array.isArray(dbBlogs)) {
        set({ blogs: dbBlogs });
        try {
          localStorage.setItem('seo_blogs', JSON.stringify(dbBlogs));
        } catch {}
      }
    } catch (err) {
      console.warn('Could not fetch blogs from DB, using cache:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addBlog: async (blogData) => {
    const newBlog = {
      id: blogData.id || `blog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: blogData.projectId || 'site-1',
      domain: blogData.domain || '',
      title: blogData.title?.trim() || '',
      url: blogData.url?.trim() || '',
      focusKeyword: blogData.focusKeyword?.trim() || '',
      secondaryKeyword: blogData.secondaryKeyword?.trim() || '',
      category: blogData.category || 'General',
      author: blogData.author || 'Admin',
      publishDate: blogData.publishDate || null,
      lastUpdated: blogData.lastUpdated || new Date().toISOString().split('T')[0],
      status: blogData.status || 'Draft',
      deletedAt: null,
      createdAt: new Date().toISOString()
    };

    // Optimistic UI update
    set((state) => {
      const updated = [newBlog, ...state.blogs.filter(b => b.id !== newBlog.id)];
      try {
        localStorage.setItem('seo_blogs', JSON.stringify(updated));
      } catch {}
      return { blogs: updated };
    });

    // DB call
    try {
      const serverBlog = await apiCreateBlog(newBlog);
      if (serverBlog && serverBlog.id) {
        set((state) => {
          const finalBlogs = state.blogs.map((b) => (b.id === newBlog.id ? serverBlog : b));
          try {
            localStorage.setItem('seo_blogs', JSON.stringify(finalBlogs));
          } catch {}
          return { blogs: finalBlogs };
        });
      }
    } catch (err) {
      console.warn('apiCreateBlog background sync notice:', err);
    }

    return newBlog;
  },

  updateBlog: async (id, updates) => {
    const updatedDate = updates.lastUpdated || new Date().toISOString().split('T')[0];
    const cleanUpdates = { ...updates, lastUpdated: updatedDate };

    // Optimistic UI update
    set((state) => {
      const updated = state.blogs.map((b) => (b.id === id ? { ...b, ...cleanUpdates } : b));
      try {
        localStorage.setItem('seo_blogs', JSON.stringify(updated));
      } catch {}
      return { blogs: updated };
    });

    // DB call
    try {
      await apiUpdateBlog(id, cleanUpdates);
    } catch (err) {
      console.warn('apiUpdateBlog background sync notice:', err);
    }
  },

  softDeleteBlog: async (id) => {
    const now = new Date().toISOString();
    set((state) => {
      const updated = state.blogs.map((b) => (b.id === id ? { ...b, deletedAt: now } : b));
      try {
        localStorage.setItem('seo_blogs', JSON.stringify(updated));
      } catch {}
      return { blogs: updated };
    });

    try {
      await apiDeleteBlog(id, false);
    } catch (err) {
      console.warn('apiDeleteBlog background sync notice:', err);
    }
  },

  restoreBlog: async (id) => {
    set((state) => {
      const updated = state.blogs.map((b) => (b.id === id ? { ...b, deletedAt: null } : b));
      try {
        localStorage.setItem('seo_blogs', JSON.stringify(updated));
      } catch {}
      return { blogs: updated };
    });

    try {
      await apiRestoreBlog(id);
    } catch (err) {
      console.warn('apiRestoreBlog background sync notice:', err);
    }
  },

  purgeBlog: async (id) => {
    set((state) => {
      const updated = state.blogs.filter((b) => b.id !== id);
      try {
        localStorage.setItem('seo_blogs', JSON.stringify(updated));
      } catch {}
      return { blogs: updated };
    });

    try {
      await apiDeleteBlog(id, true);
    } catch (err) {
      console.warn('apiDeleteBlog hard purge background sync notice:', err);
    }
  }
}));
