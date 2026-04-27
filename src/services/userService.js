import api from './api';

export const userService = {
  getAll: () => api.get('/users'),
  assignCompany: (userId, companyId) => api.put(`/users/${userId}/company`, { companyId }),
  assignRole: (userId, role) => api.put(`/users/${userId}/role`, { role }),
  delete: (userId) => api.delete(`/users/${userId}`),
};

