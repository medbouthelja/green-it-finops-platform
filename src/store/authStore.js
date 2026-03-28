import { create } from 'zustand';
import { authService } from '../services/authService';

// Mode démo : activer pour utiliser des données mockées
const DEMO_MODE = true;

// Fonction pour initialiser depuis localStorage de manière sûre
const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }
  try {
    const user = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();
    return { user, isAuthenticated };
  } catch (e) {
    return { user: null, isAuthenticated: false };
  }
};

export const useAuthStore = create((set) => ({
  ...getInitialState(),

  login: async (email, password) => {
    try {
      if (DEMO_MODE) {
        // Mode démo : authentification simulée
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (email && password) {
          // Déterminer le rôle selon l'email
          let role = 'CONSULTANT';
          if (email.includes('admin')) role = 'ADMIN';
          else if (email.includes('manager')) role = 'MANAGER';
          else if (email.includes('pm') || email.includes('project')) role = 'PROJECT_MANAGER';
          else if (email.includes('tech') || email.includes('lead')) role = 'TECH_LEAD';
          
          const mockUser = {
            id: 1,
            email: email,
            firstName: 'John',
            lastName: 'Doe',
            role: role,
          };
          
          const mockToken = 'mock-jwt-token-' + Date.now();
          
          localStorage.setItem('token', mockToken);
          localStorage.setItem('user', JSON.stringify(mockUser));
          
          set({ user: mockUser, isAuthenticated: true });
          return { success: true };
        } else {
          return { success: false, error: 'Email et mot de passe requis' };
        }
      } else {
        // Mode production : appel API réel
        const data = await authService.login(email, password);
        set({ user: data.user, isAuthenticated: true });
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Erreur de connexion' };
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },
}));

