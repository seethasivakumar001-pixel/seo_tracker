import { create } from 'zustand';

const defaultUser = {
  name: 'Alex Morgan',
  email: 'alex.morgan@techsphere.io',
  role: 'Lead Growth & Technical SEO',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  company: 'TechSphere Inc.',
  twoFactorEnabled: true,
  createdAt: '2025-11-20'
};

const getInitialAuth = () => {
  const savedAuth = localStorage.getItem('rankpulse_auth');
  if (savedAuth) {
    try {
      return JSON.parse(savedAuth);
    } catch {
      // fallback
    }
  }
  return {
    isAuthenticated: true, // Default to true for ease of exploration, but with full login/logout
    user: defaultUser,
  };
};

export const useAuthStore = create((set) => ({
  ...getInitialAuth(),
  login: (email, _password) => {
    const updated = {
      isAuthenticated: true,
      user: {
        ...defaultUser,
        email: email || defaultUser.email,
        name: email ? email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()) : defaultUser.name
      }
    };
    localStorage.setItem('rankpulse_auth', JSON.stringify(updated));
    set(updated);
    return true;
  },
  logout: () => {
    const state = { isAuthenticated: false, user: null };
    localStorage.setItem('rankpulse_auth', JSON.stringify(state));
    set(state);
  },
  updateProfile: (profileData) => {
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
