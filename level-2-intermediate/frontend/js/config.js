export const API_CONFIG = (() => {
  if (typeof window === 'undefined') return {};
  return window.__API_CONFIG__ || {};
})();

export const API_BASE = API_CONFIG.baseUrl || 'http://localhost:3000';
