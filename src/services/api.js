import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas rediriger si on est déjà sur la page de login
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // Si c'est une erreur de connexion (pas de réponse du serveur), on laisse passer
    // pour permettre la simulation côté frontend
    if (!error.response && error.code === 'ERR_NETWORK') {
      // Erreur réseau - le backend n'est pas disponible
      // On laisse le code gérer cela (simulation mock)
    }
    return Promise.reject(error);
  }
);

export default api;

