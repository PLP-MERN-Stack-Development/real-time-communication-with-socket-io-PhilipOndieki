// routes/messageRoutes.js - Message routes

const express = require('express');
const router = express.Router();
const {
  getRoomMessages,
  getDirectMessages,
  editMessage,
  deleteMessage,
  searchMessages,
  getUnreadCount,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const {
  objectIdValidation,
  paginationValidation,
  searchValidation,
} = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// Get room messages with pagination
router.get(
  '/room/:roomId',
  objectIdValidation('roomId'),
  paginationValidation,
  getRoomMessages
);

// Get direct messages between two users
router.get(
  '/direct/:userId',
  objectIdValidation('userId'),
  paginationValidation,
  getDirectMessages
);

// Edit a message
router.put('/:messageId', objectIdValidation('messageId'), editMessage);

// Delete a message
router.delete('/:messageId', objectIdValidation('messageId'), deleteMessage);

// Search messages
router.get('/search', searchValidation, searchMessages);

// Get unread message count
router.get('/unread/count', getUnreadCount);

module.exports = router;