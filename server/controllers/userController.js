// controllers/userController.js - User management controller

const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');

/** Get all online users */
const getOnlineUsers = async (req, res, next) => {
  try {
    const users = await User.findOnlineUsers();
    res.json({
      success: true,
      data: {
        users: users.map((u) => u.getPublicProfile()),
        count: users.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Search users */
const searchUsers = async (req, res, next) => {
  try {
    const { q: query } = req.query;

    if (!query) {
      return next(new ErrorResponse('Search query is required', 400));
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    }).limit(20);

    res.json({
      success: true,
      data: {
        users: users.map((u) => u.getPublicProfile()),
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Get user by ID */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.json({
      success: true,
      data: { user: user.getPublicProfile() },
    });
  } catch (error) {
    next(error);
  }
};

/** Update user profile */
const updateProfile = async (req, res, next) => {
  try {
    const { username, avatar, statusMessage, status } = req.body;

    const user = await User.findById(req.user._id);

    if (username) user.username = username;
    if (avatar) user.avatar = avatar;
    if (statusMessage) user.statusMessage = statusMessage;
    if (status) user.status = status;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: user.getPublicProfile() },
    });
  } catch (error) {
    next(error);
  }
};

/** Block user */
const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user.blockedUsers.includes(userId)) {
      user.blockedUsers.push(userId);
      await user.save();
    }

    res.json({
      success: true,
      message: 'User blocked successfully',
    });
  } catch (error) {
    next(error);
  }
};

/** Unblock user */
const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(req.user._id);
    user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== userId);
    await user.save();

    res.json({
      success: true,
      message: 'User unblocked successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOnlineUsers,
  searchUsers,
  getUserById,
  updateProfile,
  blockUser,
  unblockUser,
};