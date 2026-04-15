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

export const doctorApi = {
  search: (query = '') => api.get('/doctors/search', { params: { q: query } }),
  getMyProfile: () => api.get('/doctors/me/profile'),
  upsertMyProfile: (payload) => api.put('/doctors/me/profile', payload),
};

export const appointmentApi = {
  create: (payload) => api.post('/appointments', payload),
  listMine: () => api.get('/appointments'),
  update: (id, payload) => api.put(`/appointments/${id}`, payload),
  cancel: (id) => api.put(`/appointments/${id}/cancel`),
  delete: (id) => api.delete(`/appointments/${id}`),
  updateStatus: (id, payload) => api.put(`/appointments/${id}/status`, payload),
};

export const chatApi = {
  contacts: (query = '') => api.get('/chat/contacts', { params: { q: query } }),
  conversation: (otherUserId) => api.get(`/chat/conversations/${otherUserId}`),
  sendMessage: (payload) => api.post('/chat/messages', payload),
};

export default api;
