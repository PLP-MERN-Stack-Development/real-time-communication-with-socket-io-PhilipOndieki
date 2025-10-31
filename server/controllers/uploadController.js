// controllers/uploadController.js - File upload controller for images and files

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { ErrorResponse } = require('../middleware/errorHandler');

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/temp');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|mp4|mp3|wav/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and media files are allowed.'));
  }
};

// Multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter,
});

/**
 * @desc    Upload file (image/document/media)
 * @route   POST /api/upload
 * @access  Private
 */
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse('Please upload a file', 400));
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype.startsWith('image') ? 'image' : 
                    req.file.mimetype.startsWith('video') ? 'video' :
                    req.file.mimetype.startsWith('audio') ? 'audio' : 'file';

    // Upload to Cloudinary
    const result = await uploadToCloudinary(filePath, `echolia/${fileType}s`);

    // Delete temporary file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        size: result.size,
        fileType: fileType,
        originalName: req.file.originalname,
      },
    });
  } catch (error) {
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * @desc    Delete uploaded file
 * @route   DELETE /api/upload/:publicId
 * @access  Private
 */
const deleteFile = async (req, res, next) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return next(new ErrorResponse('Public ID is required', 400));
    }

    await deleteFromCloudinary(publicId);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload multiple files
 * @route   POST /api/upload/multiple
 * @access  Private
 */
const uploadMultipleFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new ErrorResponse('Please upload at least one file', 400));
    }

    const uploadPromises = req.files.map(async (file) => {
      const filePath = file.path;
      const fileType = file.mimetype.startsWith('image') ? 'image' : 
                      file.mimetype.startsWith('video') ? 'video' :
                      file.mimetype.startsWith('audio') ? 'audio' : 'file';

      // Upload to Cloudinary
      const result = await uploadToCloudinary(filePath, `echolia/${fileType}s`);

      // Delete temporary file
      fs.unlinkSync(filePath);

      return {
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        size: result.size,
        fileType: fileType,
        originalName: file.originalname,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length,
      },
    });
  } catch (error) {
    // Clean up temp files
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    next(error);
  }
};

/**
 * @desc    Upload avatar/profile picture
 * @route   POST /api/upload/avatar
 * @access  Private
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse('Please upload an avatar image', 400));
    }

    // Ensure it's an image
    if (!req.file.mimetype.startsWith('image')) {
      fs.unlinkSync(req.file.path);
      return next(new ErrorResponse('Please upload an image file', 400));
    }

    const filePath = req.file.path;

    // Upload to Cloudinary with avatar-specific transformations
    const cloudinary = require('cloudinary').v2;
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'echolia/avatars',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    });

    // Delete temporary file
    fs.unlinkSync(filePath);

    // Update user's avatar in database
    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: result.secure_url },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * @desc    Upload room avatar
 * @route   POST /api/upload/room-avatar
 * @access  Private
 */
const uploadRoomAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse('Please upload a room avatar image', 400));
    }

    if (!req.file.mimetype.startsWith('image')) {
      fs.unlinkSync(req.file.path);
      return next(new ErrorResponse('Please upload an image file', 400));
    }

    const filePath = req.file.path;

    // Upload to Cloudinary
    const cloudinary = require('cloudinary').v2;
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'echolia/room-avatars',
      transformation: [
        { width: 500, height: 500, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    });

    // Delete temporary file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Room avatar uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

module.exports = {
  upload,
  uploadFile,
  deleteFile,
  uploadMultipleFiles,
  uploadAvatar,
  uploadRoomAvatar,
};