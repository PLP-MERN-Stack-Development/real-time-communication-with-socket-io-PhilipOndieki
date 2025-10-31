// routes/uploadRoutes.js - File upload routes

const express = require('express');
const router = express.Router();
const {
  upload,
  uploadFile,
  deleteFile,
  uploadMultipleFiles,
  uploadAvatar,
  uploadRoomAvatar,
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Single file upload
router.post('/', upload.single('file'), uploadFile);

// Multiple files upload (max 5 files)
router.post('/multiple', upload.array('files', 5), uploadMultipleFiles);

// Delete file
router.delete('/', deleteFile);

// Upload avatar
router.post('/avatar', upload.single('avatar'), uploadAvatar);

// Upload room avatar
router.post('/room-avatar', upload.single('roomAvatar'), uploadRoomAvatar);

module.exports = router;