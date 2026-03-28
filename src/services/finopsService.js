import api from './api';

export const finopsService = {
  getCloudConsumption: (projectId) => api.get(`/finops/projects/${projectId}/consumption`),
  getCosts: (projectId) => api.get(`/finops/projects/${projectId}/costs`),
  getRecommendations: (projectId) => api.get(`/finops/projects/${projectId}/recommendations`),
  getGreenMetrics: (projectId) => api.get(`/finops/projects/${projectId}/green-metrics`),
};

