import api from './api';

export const assistantService = {
  /**
   * @param {string} message - dernier message utilisateur
   * @param {Array<{ role: string, content: string }>} [messages] - historique (tours precedents)
   */
  chat: async (message, messages = []) => {
    const response = await api.post('/assistant/chat', { message, messages });
    return response.data;
  },
};
