// client/src/utils/extendedApi.js - Extended API functions for missing endpoints
import api from './api';

// ==================== MESSAGE APIs ====================

export const messageExtendedAPI = {
  /**
   * Edit a message
   * @param {string} messageId - Message ID
   * @param {string} content - New message content
   * @returns {Promise} API response
   */
  editMessage: (messageId, content) => 
    api.put(`/messages/${messageId}`, { content }),
  
  /**
   * Delete a message
   * @param {string} messageId - Message ID
   * @returns {Promise} API response
   */
  deleteMessage: (messageId) => 
    api.delete(`/messages/${messageId}`),
  
  /**
   * Search messages
   * @param {string} query - Search query
   * @param {string} roomId - Optional room ID to search within
   * @returns {Promise} API response with matching messages
   */
  searchMessages: (query, roomId = null) => 
    api.get('/messages/search', { params: { q: query, ...(roomId && { roomId }) } }),
  
  /**
   * Get unread message count
   * @returns {Promise} API response with unread counts
   */
  getUnreadCount: () => 
    api.get('/messages/unread/count'),
};

// ==================== USER APIs ====================

export const userExtendedAPI = {
  /**
   * Update user profile
   * @param {Object} data - Profile data { username, statusMessage, status }
   * @returns {Promise} API response
   */
  updateProfile: (data) => 
    api.put('/users/profile', data),
  
  /**
   * Block a user
   * @param {string} userId - User ID to block
   * @returns {Promise} API response
   */
  blockUser: (userId) => 
    api.post(`/users/block/${userId}`),
  
  /**
   * Unblock a user
   * @param {string} userId - User ID to unblock
   * @returns {Promise} API response
   */
  unblockUser: (userId) => 
    api.delete(`/users/block/${userId}`),
  
  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise} API response
   */
  getUserById: (userId) =>
    api.get(`/users/${userId}`),
};

// ==================== ROOM APIs ====================

export const roomExtendedAPI = {
  /**
   * Update room details
   * @param {string} roomId - Room ID
   * @param {Object} data - Room data { name, description, avatar }
   * @returns {Promise} API response
   */
  updateRoom: (roomId, data) => 
    api.put(`/rooms/${roomId}`, data),
  
  /**
   * Delete a room
   * @param {string} roomId - Room ID
   * @returns {Promise} API response
   */
  deleteRoom: (roomId) => 
    api.delete(`/rooms/${roomId}`),
  
  /**
   * Add member to room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID to add
   * @returns {Promise} API response
   */
  addMember: (roomId, userId) => 
    api.post(`/rooms/${roomId}/members`, { userId }),
  
  /**
   * Remove member from room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID to remove
   * @returns {Promise} API response
   */
  removeMember: (roomId, userId) => 
    api.delete(`/rooms/${roomId}/members/${userId}`),
  
  /**
   * Get room by ID
   * @param {string} roomId - Room ID
   * @returns {Promise} API response
   */
  getRoomById: (roomId) =>
    api.get(`/rooms/${roomId}`),
};

// ==================== AUTH APIs ====================

export const authExtendedAPI = {
  /**
   * Update password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} API response
   */
  updatePassword: (currentPassword, newPassword) => 
    api.put('/auth/password', { currentPassword, newPassword }),
};

// Export all as a single object for convenience
export default {
  message: messageExtendedAPI,
  user: userExtendedAPI,
  room: roomExtendedAPI,
  auth: authExtendedAPI,
};