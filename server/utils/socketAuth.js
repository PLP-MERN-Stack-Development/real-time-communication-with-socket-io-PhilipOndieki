// utils/socketAuth.js - Socket.io authentication utilities

const { verifyAccessToken } = require('./jwtUtils');
const User = require('../models/User');

/**
 * Middleware to authenticate socket connections
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    // Get token from handshake auth
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.id).select('-password -refreshToken');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket
    socket.user = user;
    socket.userId = user._id.toString();

    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Authentication error: ' + error.message));
  }
};

/**
 * Extract user ID from socket
 */
const getUserIdFromSocket = (socket) => {
  return socket.userId || socket.user?._id?.toString();
};

/**
 * Check if socket is authenticated
 */
const isSocketAuthenticated = (socket) => {
  return !!(socket.user && socket.userId);
};

module.exports = {
  socketAuthMiddleware,
  getUserIdFromSocket,
  isSocketAuthenticated,
};