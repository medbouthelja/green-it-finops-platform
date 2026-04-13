import api from './api';

export const userService = {
  getAll: () => api.get('/users'),
  assignCompany: (userId, companyId) => api.put(`/users/${userId}/company`, { companyId }),
};

