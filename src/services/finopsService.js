import api from './api';

export const finopsService = {
  /**
   * Enregistre côté serveur l’application d’une recommandation FinOps (utilisateur connecté).
   * @param {{ recommendationId: string, title: string, type?: string, priority?: string, savings?: number }} payload
   */
  applyRecommendation: (payload) => api.post('/finops/recommendations/apply', payload),
};
