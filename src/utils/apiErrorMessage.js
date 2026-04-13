/**
 * Extrait un message lisible depuis une erreur Axios / API Symfony.
 * @param {unknown} error
 * @param {string} fallback
 * @returns {string}
 */
export function getApiErrorMessage(error, fallback) {
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return fallback;
  }
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) {
    const stripped = data.replace(/<[^>]+>/g, '').trim();
    if (stripped.length < 500) {
      return stripped.slice(0, 300);
    }
  }
  if (data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }
  if (typeof error?.message === 'string' && error.message && error.message !== 'Network Error') {
    return error.message;
  }
  return fallback;
}
