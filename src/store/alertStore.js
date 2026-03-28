import { create } from 'zustand';
import { alertService } from '../services/alertService';

export const useAlertStore = create((set, get) => ({
  alerts: [],
  unreadCount: 0,

  fetchAlerts: async () => {
    try {
      // Pour la démo, on simule les données
      // En production, utiliser: const response = await alertService.getAll();
      const mockAlerts = [
        {
          id: 1,
          title: 'Dépassement de budget',
          message: 'Le projet "Migration Cloud AWS" a dépassé 80% de son budget',
          severity: 'critical',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Optimisation disponible',
          message: '3 instances EC2 peuvent être arrêtées pour économiser 450€/mois',
          severity: 'high',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 3,
          title: 'Avancement ralenti',
          message: 'Le projet "Refonte Application Web" est en retard de 5%',
          severity: 'medium',
          read: true,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ];
      const unreadCount = mockAlerts.filter(a => !a.read).length;
      set({ alerts: mockAlerts, unreadCount });
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  },

  markAsRead: async (id) => {
    try {
      await alertService.markAsRead(id);
      const alerts = get().alerts.map(a => a.id === id ? { ...a, read: true } : a);
      const unreadCount = alerts.filter(a => !a.read).length;
      set({ alerts, unreadCount });
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  },
}));

