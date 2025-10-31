// controllers/messageController.js - Message management controller

const Message = require('../models/Message');
const Room = require('../models/Room');
const { ErrorResponse } = require('../middleware/errorHandler');

/**
 * @desc    Get messages for a room (with pagination)
 * @route   GET /api/messages/room/:roomId
 * @access  Private
 */
const getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Verify user is a member of the room
    const room = await Room.findById(roomId);
    if (!room) {
      return next(new ErrorResponse('Room not found', 404));
    }

    if (!room.isMember(req.user._id)) {
      return next(new ErrorResponse('You are not a member of this room', 403));
    }

    // Get messages
    const messages = await Message.getRoomMessages(roomId, page, limit);
    
    // Get total count
    const totalMessages = await Message.countDocuments({
      room: roomId,
      isDeleted: false,
    });

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          totalMessages,
          totalPages: Math.ceil(totalMessages / limit),
          hasMore: page * limit < totalMessages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get direct messages between two users
 * @route   GET /api/messages/direct/:userId
 * @access  Private
 */
const getDirectMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await Message.getDirectMessages(
      req.user._id,
      userId,
      page,
      limit
    );

    // Get total count
    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id },
      ],
      isDeleted: false,
    });

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          totalMessages,
          totalPages: Math.ceil(totalMessages / limit),
          hasMore: page * limit < totalMessages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Edit a message
 * @route   PUT /api/messages/:messageId
 * @access  Private
 */
const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return next(new ErrorResponse('Message content is required', 400));
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return next(new ErrorResponse('Message not found', 404));
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('You can only edit your own messages', 403));
    }

    // Check if message is not too old (optional: 15 minutes limit)
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - message.createdAt.getTime() > fifteenMinutes) {
      return next(new ErrorResponse('Cannot edit messages older than 15 minutes', 400));
    }

    // Update message
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: { message },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a message
 * @route   DELETE /api/messages/:messageId
 * @access  Private
 */
const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return next(new ErrorResponse('Message not found', 404));
    }

    // Check if user is the sender or room admin
    const isOwner = message.sender.toString() === req.user._id.toString();
    let isAdmin = false;

    if (message.room) {
      const room = await Room.findById(message.room);
      isAdmin = room && room.isAdmin(req.user._id);
    }

    if (!isOwner && !isAdmin) {
      return next(new ErrorResponse('You are not authorized to delete this message', 403));
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search messages
 * @route   GET /api/messages/search
 * @access  Private
 */
const searchMessages = async (req, res, next) => {
  try {
    const { q: query, roomId } = req.query;

    if (!query) {
      return next(new ErrorResponse('Search query is required', 400));
    }

    const messages = await Message.searchMessages(query, req.user._id, roomId);

    res.json({
      success: true,
      data: {
        messages,
        count: messages.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread message count
 * @route   GET /api/messages/unread/count
 * @access  Private
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Count unread messages in all rooms
    const rooms = await Room.find({ 'members.user': userId });
    
    let totalUnread = 0;
    const unreadByRoom = {};

    for (const room of rooms) {
      const member = room.members.find(
        (m) => m.user.toString() === userId.toString()
      );
      
      if (member) {
        totalUnread += member.unreadCount || 0;
        unreadByRoom[room._id] = member.unreadCount || 0;
      }
    }

    // Count unread direct messages
    const unreadDirectMessages = await Message.countDocuments({
      recipient: userId,
      'readBy.user': { $ne: userId },
      isDeleted: false,
    });

    totalUnread += unreadDirectMessages;

    res.json({
      success: true,
      data: {
        totalUnread,
        unreadByRoom,
        unreadDirectMessages,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoomMessages,
  getDirectMessages,
  editMessage,
  deleteMessage,
  searchMessages,
  getUnreadCount,
};