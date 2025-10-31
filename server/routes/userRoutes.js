// routes/userRoutes.js - User routes

const express = require('express');
const router = express.Router();
const {
  getOnlineUsers,
  searchUsers,
  getUserById,
  updateProfile,
  blockUser,
  unblockUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const {
  updateProfileValidation,
  objectIdValidation,
  searchValidation,
} = require('../middleware/validation');

// All routes require authentication
router.use(protect);

router.get('/online', getOnlineUsers);
router.get('/search', searchValidation, searchUsers);
router.get('/:userId', objectIdValidation('userId'), getUserById);
router.put('/profile', updateProfileValidation, updateProfile);
router.post('/block/:userId', objectIdValidation('userId'), blockUser);
router.delete('/block/:userId', objectIdValidation('userId'), unblockUser);

module.exports = router;