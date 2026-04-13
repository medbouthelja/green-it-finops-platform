import api from './api';

export const assistantService = {
  /**
   * @param {string} message - dernier message utilisateur
   * @param {Array<{ role: string, content: string }>} [messages] - historique (tours precedents)
   * @param {{ language?: string }} [options] - language: code ISO/BCP-47 ou "auto" (détection)
   */
  chat: async (message, messages = [], options = {}) => {
    const { language = 'auto' } = options;
    const response = await api.post('/assistant/chat', { message, messages, language });
    return response.data;
  },
};
