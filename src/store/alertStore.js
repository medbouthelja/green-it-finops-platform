import { create } from 'zustand';
import { alertService } from '../services/alertService';
import { useLocaleStore } from './localeStore';
import { getMockAlerts } from '../utils/alertMockData';

const READ_IDS_KEY = 'greenit_alerts_read_v1';

function loadReadIds() {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids) {
  try {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

function applyStoredReadState(alerts) {
  const readIds = loadReadIds();
  return alerts.map((a) => ({ ...a, read: Boolean(a.read || readIds.has(a.id)) }));
}

export const useAlertStore = create((set, get) => ({
  alerts: [],
  unreadCount: 0,

  fetchAlerts: async () => {
    try {
      const locale = useLocaleStore.getState().locale;
      const mockAlerts = applyStoredReadState(getMockAlerts(locale));
      const unreadCount = mockAlerts.filter((a) => !a.read).length;
      set({ alerts: mockAlerts, unreadCount });
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  },

  markAsRead: async (id) => {
    const readIds = loadReadIds();
    readIds.add(id);
    saveReadIds(readIds);
    const alerts = get().alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
    const unreadCount = alerts.filter((a) => !a.read).length;
    set({ alerts, unreadCount });
    try {
      await alertService.markAsRead(id);
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  },

  markAllAsRead: async () => {
    const readIds = loadReadIds();
    get().alerts.forEach((a) => readIds.add(a.id));
    saveReadIds(readIds);
    const alerts = get().alerts.map((a) => ({ ...a, read: true }));
    set({ alerts, unreadCount: 0 });
    try {
      await alertService.markAllAsRead();
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  },
}));

