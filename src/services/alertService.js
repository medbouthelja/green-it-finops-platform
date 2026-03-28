import api from './api';

export const alertService = {
  getAll: () => api.get('/alerts'),
  getByProject: (projectId) => api.get(`/alerts?projectId=${projectId}`),
  markAsRead: (id) => api.put(`/alerts/${id}/read`),
  markAllAsRead: () => api.put('/alerts/read-all'),
};

