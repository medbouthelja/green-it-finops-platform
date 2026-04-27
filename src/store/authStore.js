import { create } from 'zustand';
import { authService } from '../services/authService';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

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

  /**
   * Step 1 login (real API): valid password → need 6-digit code.
   * Demo mode: single-step mock JWT.
   */
  login: async (email, password) => {
    try {
      if (DEMO_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (email && password) {
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
            emailVerified: true,
            company:
              role === 'ADMIN'
                ? null
                : { id: 1, name: 'Demo Corp' },
          };

          const mockToken = 'mock-jwt-token-' + Date.now();

          localStorage.setItem('token', mockToken);
          localStorage.setItem('user', JSON.stringify(mockUser));

          set({ user: mockUser, isAuthenticated: true });
          return { success: true };
        }
        return { success: false, error: 'Email et mot de passe requis' };
      }

      const data = await authService.requestLoginChallenge(email, password);
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        set({ user: data.user, isAuthenticated: true });
        return { success: true };
      }
      if (data.step === 'verify_login') {
        return {
          success: true,
          needsCode: true,
          email: data.email || email,
        };
      }

      return {
        success: false,
        error: data.message || 'Réponse inattendue du serveur',
      };
    } catch (error) {
      const errData = error.response?.data;
      const backendMsg =
        (typeof errData === 'object' && errData && 'message' in errData && errData.message) ||
        (typeof errData === 'object' && errData && 'detail' in errData && errData.detail);

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

      if (error.response?.status === 403 && errData?.code === 'EMAIL_NOT_VERIFIED') {
        return {
          success: false,
          needsSignupVerification: true,
          email: email,
          error: backendMsg || 'Email non vérifié',
        };
      }

      return {
        success: false,
        error: backendMsg || error.message || 'Erreur de connexion',
      };
    }
  },

  completeLogin: async (email, code) => {
    try {
      const data = await authService.verifyLogin(email, code);
      set({ user: data.user, isAuthenticated: true });
      return { success: true, user: data.user };
    } catch (error) {
      const data = error.response?.data;
      const backendMsg =
        (typeof data === 'object' && data && 'message' in data && data.message) ||
        (typeof data === 'object' && data && 'detail' in data && data.detail);
      return {
        success: false,
        error: backendMsg || error.message || 'Code invalide',
      };
    }
  },

  register: async ({ email, password, firstName, lastName }) => {
    try {
      await authService.register({ email, password, firstName, lastName });
      return { success: true };
    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message || error.message || 'Erreur';
      return { success: false, error: msg };
    }
  },

  verifySignup: async (email, code) => {
    try {
      await authService.verifySignup(email, code);
      return { success: true };
    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message || error.message || 'Erreur';
      return { success: false, error: msg };
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

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
