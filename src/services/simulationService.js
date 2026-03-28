import api from './api';

export const simulationService = {
  simulate: (projectId, scenario) => api.post(`/simulations/projects/${projectId}`, scenario),
};

