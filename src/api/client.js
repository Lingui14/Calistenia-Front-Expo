import axios from 'axios';

// URL de producción en Railway
export const API_BASE_URL = 'https://calistenia-backend-production-6e8f.up.railway.app';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;