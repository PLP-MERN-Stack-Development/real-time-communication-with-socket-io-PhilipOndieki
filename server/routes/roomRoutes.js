// routes/roomRoutes.js - Room routes

const express = require('express');
const router = express.Router();
const {
  getPublicRooms,
  getUserRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  addMember,
  removeMember,
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');
const {
  createRoomValidation,
  objectIdValidation,
} = require('../middleware/validation');

// All routes require authentication
router.use(protect);

router.get('/public', getPublicRooms);
router.get('/my-rooms', getUserRooms);
router.get('/:roomId', objectIdValidation('roomId'), getRoomById);
router.post('/', createRoomValidation, createRoom);
router.put('/:roomId', objectIdValidation('roomId'), updateRoom);
router.delete('/:roomId', objectIdValidation('roomId'), deleteRoom);
router.post('/:roomId/members', objectIdValidation('roomId'), addMember);
router.delete('/:roomId/members/:userId', objectIdValidation('roomId'), removeMember);

module.exports = router;