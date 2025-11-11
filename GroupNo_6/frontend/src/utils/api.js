import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const AI_API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL|| 'http://localhost:8000';
const REQUEST_TIMEOUT = 20_000; // 20s
const BASE = import.meta.env.VITE_API_BASE_URL;

// Create axios instances
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT,
});

export const aiApi = axios.create({
  baseURL: AI_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT,
});

// Helper to safely set Authorization header
function attachAuthHeader(config = {}) {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      if (!config.headers) config.headers = {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // localStorage may throw in some environments — ignore silently
  }
  return config;
}

// Request interceptors to add auth token
api.interceptors.request.use(
  (config) => attachAuthHeader(config || {}),
  (error) => Promise.reject(error)
);

aiApi.interceptors.request.use(
  (config) => attachAuthHeader(config || {}),
  (error) => Promise.reject(error)
);

// Centralised response error handling
const handleResponseError = (error) => {
  // handle null/undefined error safely
  if (!error || !error.response) {
    // optionally show UI toast here
    return Promise.reject(error);
  }

  const status = error.response.status;

  if (status === 401) {
    // clear auth and redirect to login
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {}
    // safeguard: don't force navigate if we are already on auth routes
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/';
    }
  }

  return Promise.reject(error);
};

api.interceptors.response.use((response) => response, handleResponseError);
aiApi.interceptors.response.use((response) => response, handleResponseError);

// Auth API functions
export const authAPI = {
  register: ({ firstname, lastname, email, password }) => {
    return api.post('/api/auth/register', {
      firstname: firstname,
      lastname: lastname,
      email,
      password,
    });
  },

  login: ({ email, password }) => {
    return api.post('/api/auth/login', { email, password });
  },

  refreshToken: (refreshToken) => {
    return api.post('/api/auth/refresh', { refreshToken });
  },

  logout: () => {
    // optional: call backend logout endpoint if exists
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {}
    return Promise.resolve();
  },
};

// User API functions
export const userAPI = {
  getMe: async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${BASE}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  getById: async () => {
    const token = localStorage.getItem('token');
    const id = localStorage.getItem('userId');
    const res = await axios.get(`${BASE}/api/user/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  updateMyProfile: async (payload) => {
    const token = localStorage.getItem('token');
    const id = localStorage.getItem('userId');
    const res = await axios.put(`${BASE}/api/user/${id}/profile`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  getMyHistory: async (page = 1, limit = 10) => {
    const token = localStorage.getItem('token');
    const id = localStorage.getItem('userId');
    const res = await axios.get(`${BASE}/api/user/${id}/history`, {
      params: { page, limit },
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};

// Recommendations API functions
export const recommendationAPI = {
  getRecommendations: (params = {}) => api.get('/api/recommendations', { params }),
  generateRecommendations: (quizData) => api.post('/api/recommendations/generate', quizData),
  getRecommendationById: (id) => api.get(`/api/recommendations/${id}`),
};

// Likes API functions
export const likesAPI = {
  getLikedOutfits: (params = {}) => api.get('/api/likes', { params }),
  likeOutfit: (outfitData) => api.post('/api/likes', outfitData),
  unlikeOutfit: (outfitId) => api.delete(`/api/likes/${outfitId}`),
};

// Saves API functions
export const savesAPI = {
  getSavedOutfits: (params = {}) => api.get('/api/saves', { params }),
  saveOutfit: (outfitData) => api.post('/api/saves', outfitData),
  unsaveOutfit: (outfitId) => api.delete(`/api/saves/${outfitId}`),
};

// Outfits API functions
export const outfitAPI = {
  getOutfits: (params = {}) => api.get('/api/outfits', { params }),
  getOutfit: (outfitId) => api.get(`/api/outfits/${outfitId}`),
  createOutfit: (outfitData) => api.post('/api/outfits', outfitData),
  updateOutfit: (outfitId, outfitData) => api.put(`/api/outfits/${outfitId}`, outfitData),
  deleteOutfit: (outfitId) => api.delete(`/api/outfits/${outfitId}`),
};

// AI API functions
export const aiAPI = {
  generateRecommendations: (quizData) => {
    // Route through Node.js backend instead of calling FastAPI directly
    return api.post('/api/recommendations/generate', quizData);
  },
  getModelsStatus: () => aiApi.get('/api/ai/models/status'),
  buildEmbeddings: () => aiApi.post('/api/ai/embeddings/build'),
  getEmbeddingsStatus: () => aiApi.get('/api/ai/embeddings/status'),
};

// Generic API helper functions
export const apiHelpers = {
  handleError: (error) => {
    console.error('API Error:', error);

    if (!error) return 'An unexpected error occurred';

    if (error.response) {
      // backend returned an error payload
      const data = error.response.data || {};
      return data.message || data.error || `Server error (${error.response.status})`;
    } else if (error.request) {
      // request made but no response
      return 'Network error. Please check your connection.';
    } else {
      // something else happened
      return error.message || 'An unexpected error occurred';
    }
  },

  isNetworkError: (error) => {
    return !!(error && !error.response && error.request);
  },

  getErrorMessage: (error) => {
    if (!error) return 'An unexpected error occurred';
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred'
    );
  },
};

export default api;