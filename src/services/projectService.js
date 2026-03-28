import api from './api';

export const projectService = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getBudget: (id) => api.get(`/projects/${id}/budget`),
  getProgress: (id) => api.get(`/projects/${id}/progress`),
  addTimeEntry: (projectId, data) => api.post(`/projects/${projectId}/time-entries`, data),
  getTimeEntries: (projectId) => api.get(`/projects/${projectId}/time-entries`),
};

