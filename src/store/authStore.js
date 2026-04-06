import { create } from 'zustand';
import { authService } from '../services/authService';

// Définir VITE_DEMO_MODE=true dans .env pour le mode démo sans backend
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

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
          let role = 'MANAGER';
          if (email.includes('admin')) role = 'ADMIN';
          else if (email.includes('manager')) role = 'MANAGER';
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
      const data = error.response?.data;
      const backendMsg =
        (typeof data === 'object' && data && 'message' in data && data.message) ||
        (typeof data === 'object' && data && 'detail' in data && data.detail);

      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
        return {
          success: false,
          error:
            'Impossible de contacter l’API (http://localhost:8000). Démarrez le backend Symfony : dans le dossier backend, exécutez « php -S localhost:8000 -t public » après composer install et les commandes Doctrine (voir backend/README.md).',
        };
      }
      if (error.response?.status === 401) {
        const invalid =
          typeof backendMsg === 'string' &&
          /invalid credential|email ou mot de passe|incorrect/i.test(backendMsg);
        return {
          success: false,
          error: invalid
            ? 'Identifiants incorrects ou compte absent en base. Mot de passe des fixtures : password. Dans le dossier backend, exécutez : php bin/console app:create-demo-users'
            : backendMsg || 'Email ou mot de passe incorrect.',
        };
      }

      return {
        success: false,
        error: backendMsg || error.message || 'Erreur de connexion',
      };
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  /** Met à jour l'utilisateur en session (localStorage + state), ex. depuis la page Paramètres */
  updateProfile: (partial) => {
    const current = authService.getCurrentUser();
    if (!current) {
      return false;
    }
    const next = { ...current, ...partial };
    localStorage.setItem('user', JSON.stringify(next));
    set({ user: next });
    return true;
  },
}));

