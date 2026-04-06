import axios from 'axios';

// ─── Axios instance ────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ─── Request interceptor – attach JWT if present ───────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medigo_token');
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
      localStorage.removeItem('medigo_token');
      window.location.href = '/login';
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
