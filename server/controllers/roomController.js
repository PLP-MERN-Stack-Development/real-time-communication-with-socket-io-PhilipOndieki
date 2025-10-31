// controllers/roomController.js - Room management controller

const Room = require('../models/room');
const { ErrorResponse } = require('../middleware/errorHandler');

/** Get all public rooms */
const getPublicRooms = async (req, res, next) => {
  try {
    const rooms = await Room.getPublicRooms();
    res.json({ success: true, data: { rooms } });
  } catch (error) {
    next(error);
  }
};

/** Get user's rooms */
const getUserRooms = async (req, res, next) => {
  try {
    const rooms = await Room.getUserRooms(req.user._id);
    res.json({ success: true, data: { rooms } });
  } catch (error) {
    next(error);
  }
};

/** Get room by ID */
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('creator', 'username avatar')
      .populate('members.user', 'username avatar status isOnline');
    
    if (!room) {
      return next(new ErrorResponse('Room not found', 404));
    }

    // Check if user has access
    if (room.roomType === 'private' && !room.isMember(req.user._id)) {
      return next(new ErrorResponse('Access denied', 403));
    }

    res.json({ success: true, data: { room } });
  } catch (error) {
    next(error);
  }
};

/** Create new room */
const createRoom = async (req, res, next) => {
  try {
    const { name, description, roomType = 'public', avatar } = req.body;

    const room = await Room.create({
      name,
      description,
      roomType,
      avatar: avatar || `https://ui-avatars.com/api/?background=random&name=${name}`,
      creator: req.user._id,
      members: [{
        user: req.user._id,
        role: 'admin',
      }],
      admins: [req.user._id],
    });

    await room.populate('creator', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: { room },
    });
  } catch (error) {
    next(error);
  }
};

/** Update room */
const updateRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { name, description, avatar } = req.body;

    const room = await Room.findById(roomId);

    if (!room) {
      return next(new ErrorResponse('Room not found', 404));
    }

    if (!room.isAdmin(req.user._id)) {
      return next(new ErrorResponse('Only admins can update the room', 403));
    }

    if (name) room.name = name;
    if (description) room.description = description;
    if (avatar) room.avatar = avatar;

    await room.save();

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: { room },
    });
  } catch (error) {
    next(error);
  }
};

/** Delete room */
const deleteRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);

    if (!room) {
      return next(new ErrorResponse('Room not found', 404));
    }

    if (room.creator.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Only the creator can delete the room', 403));
    }

    await room.deleteOne();

    res.json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/** Add member to room */
const addMember = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    const room = await Room.findById(roomId);

    if (!room) {
      return next(new ErrorResponse('Room not found', 404));
    }

    if (room.roomType === 'private' && !room.isAdmin(req.user._id)) {
      return next(new ErrorResponse('Only admins can add members to private rooms', 403));
    }

    await room.addMember(userId);

    res.json({
      success: true,
      message: 'Member added successfully',
      data: { room },
    });
  } catch (error) {
    next(error);
  }
};

/** Remove member from room */
const removeMember = async (req, res, next) => {
  try {
    const { roomId, userId } = req.params;

    const room = await Room.findById(roomId);

    if (!room) {
      return next(new ErrorResponse('Room not found', 404));
    }

    const isRemovingSelf = userId === req.user._id.toString();
    const isAdmin = room.isAdmin(req.user._id);

    if (!isRemovingSelf && !isAdmin) {
      return next(new ErrorResponse('Only admins can remove other members', 403));
    }

    await room.removeMember(userId);

    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicRooms,
  getUserRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  addMember,
  removeMember,
};