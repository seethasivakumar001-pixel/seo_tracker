import { create } from 'zustand';
import { initialNotifications } from '../data/mockNotifications';

const getInitialNotifications = () => {
  try {
    const saved = localStorage.getItem('rankpulse_notifications');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error reading notifications from localStorage', e);
  }
  return initialNotifications;
};

export const useNotificationStore = create((set, get) => ({
  notifications: getInitialNotifications(),
  
  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      localStorage.setItem('rankpulse_notifications', JSON.stringify(updated));
      return { notifications: updated };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      localStorage.setItem('rankpulse_notifications', JSON.stringify(updated));
      return { notifications: updated };
    });
  },

  addNotification: (notif) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      websiteId: notif.websiteId || 'site-1',
      type: notif.type || 'ranking_gain',
      category: notif.category || 'rankings',
      title: notif.title,
      message: notif.message,
      timestamp: new Date().toISOString(),
      read: false,
      link: notif.link || '/notifications'
    };

    set((state) => {
      const updated = [newNotif, ...state.notifications];
      localStorage.setItem('rankpulse_notifications', JSON.stringify(updated));
      return { notifications: updated };
    });
    return newNotif;
  },

  deleteNotification: (id) => {
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      localStorage.setItem('rankpulse_notifications', JSON.stringify(updated));
      return { notifications: updated };
    });
  }
}));
