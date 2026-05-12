import axios from 'axios';
import { authSession } from '../../features/auth/authSession';
import { authEvents } from '../../features/auth/authEventBus';

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
  uploadDocument: (docType, file) => {
    const form = new FormData();
    form.append('docType', docType);
    form.append('file', file);
    return api.post('/doctors/me/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
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

export const adminApi = {
  getPendingDoctors: () => api.get('/admin/doctors/pending'),
  approveDoctor: (doctorId) => api.put(`/admin/doctors/${doctorId}/approve`),
  rejectDoctor: (doctorId, reason) => api.put(`/admin/doctors/${doctorId}/reject`, { reason }),
  serveDocument: (filename) => api.get(`/admin/documents/${filename}`, { responseType: 'blob' }),
};

/** Fetch any authenticated file URL and return a blob object URL.
 *  The url should be a full path like /api/v1/doctors/me/documents/uuid.jpg
 *  We strip the baseURL prefix so axios doesn't double it. */
export function fetchAuthBlob(url) {
  // Strip the /api/v1 prefix since the axios instance already has it as baseURL
  const base = '/api/v1';
  const relativeUrl = url.startsWith(base) ? url.slice(base.length) : url;
  return api.get(relativeUrl, { responseType: 'blob' }).then(r => URL.createObjectURL(r.data));
}

export default api;
