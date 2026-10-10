import { create } from 'zustand';

const getInitialAuth = () => {
  const savedAuth = localStorage.getItem('rankpulse_auth');
  if (savedAuth) {
    try {
      const parsed = JSON.parse(savedAuth);
      if (parsed && typeof parsed === 'object' && parsed.user && parsed.isAuthenticated) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  return {
    isAuthenticated: false,
    user: null,
  };
};

export const useAuthStore = create((set, get) => ({
  ...getInitialAuth(),

  login: async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed. Please check your credentials.');
    }

    const dbUser = data.user;
    const cleanEmail = (email || '').trim().toLowerCase();

    const userObj = {
      id: dbUser.id || `usr-${Date.now()}`,
      name: dbUser.name || (cleanEmail ? cleanEmail.split('@')[0] : 'SEO User'),
      email: dbUser.email || cleanEmail,
      avatar: dbUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(dbUser.name || 'User')}`,
      role: cleanEmail.includes('admin') || cleanEmail.includes('pm') ? 'Project Manager' : 'SEO Specialist',
      isPM: cleanEmail.includes('admin') || cleanEmail.includes('pm'),
      company: 'SysCorp Analytics',
      createdAt: dbUser.createdAt || new Date().toISOString()
    };

    const updated = {
      isAuthenticated: true,
      user: userObj
    };

    localStorage.setItem('rankpulse_auth', JSON.stringify(updated));
    set(updated);
    return userObj;
  },

  register: async (name, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed. Please try again.');
    }

    const dbUser = data.user;
    const userObj = {
      id: dbUser.id || `usr-${Date.now()}`,
      name: dbUser.name,
      email: dbUser.email,
      avatar: dbUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(dbUser.name)}`,
      role: 'SEO Specialist',
      isPM: false,
      company: 'SysCorp Analytics',
      createdAt: dbUser.createdAt || new Date().toISOString()
    };

    const updated = {
      isAuthenticated: true,
      user: userObj
    };

    localStorage.setItem('rankpulse_auth', JSON.stringify(updated));
    set(updated);
    return userObj;
  },

  logout: () => {
    const state = { isAuthenticated: false, user: null };
    localStorage.removeItem('rankpulse_auth');
    set(state);
  },

  updateProfile: async (profileData) => {
    const currentUser = get().user;
    if (currentUser?.id) {
      try {
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentUser.id,
            name: profileData.name,
            avatar: profileData.avatar,
            password: profileData.password
          }),
        });
      } catch (err) {
        console.warn('Profile sync to backend warning:', err.message);
      }
    }

    set((state) => {
      const updated = {
        ...state,
        user: { ...state.user, ...profileData }
      };
      localStorage.setItem('rankpulse_auth', JSON.stringify(updated));
      return updated;
    });
  }
}));
