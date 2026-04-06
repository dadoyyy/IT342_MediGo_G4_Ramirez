import axios from 'axios';
import { authSession } from '../session/authSession';
import { authEvents } from '../patterns/observer/authEventBus';

// ─── Axios instance ────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ─── Request interceptor – attach JWT if present ───────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = authSession.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor – handle 401 globally ───────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/')
    ) {
      authSession.clearSession();
      authEvents.emit(authEvents.names.sessionExpired);
      globalThis.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ─── Auth endpoints ────────────────────────────────────────────────────────

export const authApi = {
  register:       (payload)              => api.post('/auth/register', payload),
  login:          (payload)              => api.post('/auth/login', payload),
  logout:         ()                     => api.post('/auth/logout'),
  completeOAuth2: (pendingToken, role)   => api.post('/auth/oauth2/complete', { pendingToken, role }),
  me:             ()                     => api.get('/auth/me'),
};

export default api;
