import { create } from 'zustand';

const getInitialTheme = () => {
  const saved = localStorage.getItem('syscorp_theme');
  if (saved) return saved;
  // Clear any legacy dark mode keys
  try {
    localStorage.removeItem('rankpulse_theme');
    localStorage.setItem('syscorp_theme', 'light');
  } catch {
    // Ignore storage exceptions
  }
  return 'light';
};

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  initTheme: () => {
    const theme = getInitialTheme();
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('syscorp_theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: newTheme };
    });
  },
  setTheme: (theme) => {
    localStorage.setItem('syscorp_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
}));
