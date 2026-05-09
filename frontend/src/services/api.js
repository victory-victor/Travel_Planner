import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('wm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wm_token');
      localStorage.removeItem('wm_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  deleteAccount: () => API.delete('/auth/delete-account'),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  verifyOTP: (email, otp) => API.post('/auth/verify-otp', { email, otp }),
  resetPassword: (email, newPassword) => API.post('/auth/reset-password', { email, newPassword }),
};

// ── Trips ─────────────────────────────────────────
export const tripAPI = {
  create: (data) => API.post('/trips', data),
  getAll: () => API.get('/trips'),
  getOne: (id) => API.get(`/trips/${id}`),
  update: (id, data) => API.put(`/trips/${id}`, data),
  delete: (id) => API.delete(`/trips/${id}`),
  saveItinerary: (id, itinerary) => API.put(`/trips/${id}/itinerary`, { itinerary }),
  savePackingList: (id, packingList) => API.put(`/trips/${id}/packing-list`, { packingList }),
  addMember: (id, userId) => API.post(`/trips/${id}/members`, { userId }),
  addExpense: (id, expenseData) => API.post(`/trips/${id}/expenses`, expenseData),
};

// ── AI ────────────────────────────────────────────
export const aiAPI = {
  generateItinerary: (data) => API.post('/ai/itinerary', data),
  getSuggestions: (data) => API.post('/ai/suggestions', data),
  chat: (messages, tripContext) => API.post('/ai/chat', { messages, tripContext }),
  getPackingList: (data) => API.post('/ai/packing-list', data),
  optimizeBudget: (data) => API.post('/ai/budget', data),
  getEstimates: (data) => API.post('/ai/estimates', data),
};

// ── Invites ───────────────────────────────────────
export const inviteAPI = {
  send: (tripId, email) => API.post('/invites/send', { tripId, email }),
  get: (token) => API.get(`/invites/${token}`),
  accept: (token) => API.post('/invites/accept', { token }),
};

// ── Chat ──────────────────────────────────────────
export const chatAPI = {
  getHistory: (tripId, params) => API.get(`/chat/${tripId}`, { params }),
  sendMessage: (tripId, data) => API.post(`/chat/${tripId}`, data),
  reactToMessage: (msgId, emoji) => API.patch(`/chat/message/${msgId}/react`, { emoji }),
  deleteMessage: (msgId) => API.delete(`/chat/message/${msgId}`),
};

export default API;
