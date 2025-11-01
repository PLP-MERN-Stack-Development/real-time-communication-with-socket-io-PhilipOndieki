// src/utils/api.js - API client utilities

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/password', data),
};

// User API
export const userAPI = {
  getOnlineUsers: () => api.get('/users/online'),
  searchUsers: (query) => api.get('/users/search', { params: { q: query } }),
  getUserById: (userId) => api.get(`/users/${userId}`),
  updateProfile: (data) => api.put('/users/profile', data),
  blockUser: (userId) => api.post(`/users/block/${userId}`),
  unblockUser: (userId) => api.delete(`/users/block/${userId}`),
};

// Room API
export const roomAPI = {
  getPublicRooms: () => api.get('/rooms/public'),
  getUserRooms: () => api.get('/rooms/my-rooms'),
  getRoomById: (roomId) => api.get(`/rooms/${roomId}`),
  createRoom: (data) => api.post('/rooms', data),
  updateRoom: (roomId, data) => api.put(`/rooms/${roomId}`, data),
  deleteRoom: (roomId) => api.delete(`/rooms/${roomId}`),
  addMember: (roomId, userId) => api.post(`/rooms/${roomId}/members`, { userId }),
  removeMember: (roomId, userId) => api.delete(`/rooms/${roomId}/members/${userId}`),
};

// Message API
export const messageAPI = {
  getRoomMessages: (roomId, page = 1, limit = 50) =>
    api.get(`/messages/room/${roomId}`, { params: { page, limit } }),
  getDirectMessages: (userId, page = 1, limit = 50) =>
    api.get(`/messages/direct/${userId}`, { params: { page, limit } }),
  editMessage: (messageId, content) =>
    api.put(`/messages/${messageId}`, { content }),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  searchMessages: (query, roomId) =>
    api.get('/messages/search', { params: { q: query, roomId } }),
  getUnreadCount: () => api.get('/messages/unread/count'),
};

// Upload API
export const uploadAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteFile: (publicId) => api.delete('/upload', { data: { publicId } }),
};

export default api;