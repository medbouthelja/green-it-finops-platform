import api from './api';

export const authService = {
  /** Step 1: password OK → API sends 6-digit code (no JWT yet). */
  requestLoginChallenge: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /** Step 2: code OK → JWT + user stored. */
  verifyLogin: async (email, code) => {
    const response = await api.post('/auth/verify-login', { email, code });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (payload) => {
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  verifySignup: async (email, code) => {
    const response = await api.post('/auth/verify-signup', {
      email,
      code: String(code).replace(/\D/g, ''),
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};
