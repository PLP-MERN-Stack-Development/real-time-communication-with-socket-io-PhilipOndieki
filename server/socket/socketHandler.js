// socket/socketHandler.js - Main Socket.io event handler
// This is the core of Echolia's real-time communication

const { Server } = require('socket.io');
const { socketAuthMiddleware } = require('../utils/socketAuth');
const User = require('../models/User');
const Message = require('../models/Message');
const Room = require('../models/Room');

// Store for tracking typing users and online users
const onlineUsers = new Map(); // userId -> socketId
const typingUsers = new Map(); // roomId -> Set of userIds
const userSockets = new Map(); // userId -> Set of socketIds (for multiple tabs)

/**
 * Initialize Socket.io server
 */
const initializeSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000,
  });

  // Authentication middleware
  io.use(socketAuthMiddleware);

  // Main connection handler
  io.on('connection', async (socket) => {
    const userId = socket.userId;
    const user = socket.user;

    console.log(`✅ User connected: ${user.username} (${userId})`);

    try {
      // Add socket to user's socket set (for multiple tabs)
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      // Update user status to online
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        status: 'online',
        socketId: socket.id,
        lastSeen: new Date(),
      });

      onlineUsers.set(userId, socket.id);

      // Join user's rooms
      const userRooms = await Room.find({ 'members.user': userId });
      userRooms.forEach((room) => {
        socket.join(room._id.toString());
      });

      // Emit online status to all users
      io.emit('user:online', {
        userId,
        username: user.username,
        avatar: user.avatar,
        timestamp: new Date(),
      });

      // Send user's data back
      socket.emit('connection:success', {
        userId,
        username: user.username,
        socketId: socket.id,
        rooms: userRooms.map((r) => r._id),
      });

      // ==================== MESSAGE EVENTS ====================

      /**
       * Send message to a room
       */
      socket.on('message:send', async (data, callback) => {
        try {
          const { roomId, content, messageType = 'text', fileUrl, replyTo } = data;

          // Verify user is a member of the room
          const room = await Room.findById(roomId);
          if (!room || !room.isMember(userId)) {
            return callback?.({
              success: false,
              message: 'You are not a member of this room',
            });
          }

          // Create message
          const message = await Message.create({
            content,
            sender: userId,
            room: roomId,
            messageType,
            fileUrl,
            replyTo,
          });

          // Populate sender info
          await message.populate('sender', 'username avatar status');
          if (replyTo) {
            await message.populate('replyTo');
          }

          // Update room's last message and activity
          room.lastMessage = message._id;
          room.lastActivity = new Date();
          await room.save();

          // Update unread count for other members
          room.members.forEach((member) => {
            if (member.user.toString() !== userId) {
              room.updateUnreadCount(member.user.toString(), true);
            }
          });

          // Emit to room
          io.to(roomId).emit('message:receive', {
            message: message.toObject(),
            roomId,
          });

          // Send notification to offline users
          room.members.forEach((member) => {
            const memberId = member.user.toString();
            if (memberId !== userId && !onlineUsers.has(memberId)) {
              // Could integrate with push notification service here
              console.log(`📬 Notification queued for offline user: ${memberId}`);
            }
          });

          callback?.({ success: true, message: message.toObject() });
        } catch (error) {
          console.error('Error sending message:', error);
          callback?.({ success: false, message: error.message });
        }
      });

      /**
       * Send private/direct message
       */
      socket.on('message:private', async (data, callback) => {
        try {
          const { recipientId, content, messageType = 'text', fileUrl } = data;

          // Create private message
          const message = await Message.create({
            content,
            sender: userId,
            recipient: recipientId,
            messageType,
            fileUrl,
          });

          await message.populate('sender', 'username avatar status');

          // Send to recipient if online
          const recipientSocketIds = userSockets.get(recipientId);
          if (recipientSocketIds) {
            recipientSocketIds.forEach((socketId) => {
              io.to(socketId).emit('message:private:receive', {
                message: message.toObject(),
              });
            });

            // Mark as delivered
            await message.markAsDelivered(recipientId);
          }

          // Send back to sender (for multi-device sync)
          socket.emit('message:private:receive', {
            message: message.toObject(),
          });

          callback?.({ success: true, message: message.toObject() });
        } catch (error) {
          console.error('Error sending private message:', error);
          callback?.({ success: false, message: error.message });
        }
      });

      /**
       * Mark message as read
       */
      socket.on('message:read', async (data, callback) => {
        try {
          const { messageId, roomId } = data;

          const message = await Message.findById(messageId);
          if (!message) {
            return callback?.({ success: false, message: 'Message not found' });
          }

          await message.markAsRead(userId);

          // Notify sender
          const senderId = message.sender.toString();
          const senderSocketIds = userSockets.get(senderId);
          if (senderSocketIds) {
            senderSocketIds.forEach((socketId) => {
              io.to(socketId).emit('message:read:confirm', {
                messageId,
                readBy: userId,
                readAt: new Date(),
              });
            });
          }

          // Update room unread count
          if (roomId) {
            const room = await Room.findById(roomId);
            if (room) {
              await room.updateUnreadCount(userId, false);
            }
          }

          callback?.({ success: true });
        } catch (error) {
          console.error('Error marking message as read:', error);
          callback?.({ success: false, message: error.message });
        }
      });

      /**
       * Add reaction to message
       */
      socket.on('message:reaction:add', async (data, callback) => {
        try {
          const { messageId, emoji } = data;

          const message = await Message.findById(messageId);
          if (!message) {
            return callback?.({ success: false, message: 'Message not found' });
          }

          await message.addReaction(userId, emoji);

          // Broadcast to room or direct message recipient
          if (message.room) {
            io.to(message.room.toString()).emit('message:reaction:update', {
              messageId,
              reactions: message.reactions,
            });
          } else if (message.recipient) {
            const recipientSocketIds = userSockets.get(message.recipient.toString());
            if (recipientSocketIds) {
              recipientSocketIds.forEach((socketId) => {
                io.to(socketId).emit('message:reaction:update', {
                  messageId,
                  reactions: message.reactions,
                });
              });
            }
          }

          callback?.({ success: true, reactions: message.reactions });
        } catch (error) {
          console.error('Error adding reaction:', error);
          callback?.({ success: false, message: error.message });
        }
      });

      /**
       * Remove reaction from message
       */
      socket.on('message:reaction:remove', async (data, callback) => {
        try {
          const { messageId } = data;

          const message = await Message.findById(messageId);
          if (!message) {
            return callback?.({ success: false, message: 'Message not found' });
          }

          await message.removeReaction(userId);

          // Broadcast update
          if (message.room) {
            io.to(message.room.toString()).emit('message:reaction:update', {
              messageId,
              reactions: message.reactions,
            });
          }

          callback?.({ success: true, reactions: message.reactions });
        } catch (error) {
          console.error('Error removing reaction:', error);
          callback?.({ success: false, message: error.message });
        }
      });

      // ==================== TYPING INDICATORS ====================

      /**
       * User started typing
       */
      socket.on('typing:start', async (data) => {
        const { roomId, recipientId } = data;

        if (roomId) {
          // Typing in room
          if (!typingUsers.has(roomId)) {
            typingUsers.set(roomId, new Set());
          }
          typingUsers.get(roomId).add(userId);

          socket.to(roomId).emit('typing:update', {
            roomId,
            userId,
            username: user.username,
            isTyping: true,
          });
        } else if (recipientId) {
          // Typing in private chat
          const recipientSocketIds = userSockets.get(recipientId);
          if (recipientSocketIds) {
            recipientSocketIds.forEach((socketId) => {
              io.to(socketId).emit('typing:update', {
                userId,
                username: user.username,
                isTyping: true,
              });
            });
          }
        }
      });

      /**
       * User stopped typing
       */
      socket.on('typing:stop', async (data) => {
        const { roomId, recipientId } = data;

        if (roomId) {
          const typingSet = typingUsers.get(roomId);
          if (typingSet) {
            typingSet.delete(userId);
          }

          socket.to(roomId).emit('typing:update', {
            roomId,
            userId,
            username: user.username,
            isTyping: false,
          });
        } else if (recipientId) {
          const recipientSocketIds = userSockets.get(recipientId);
          if (recipientSocketIds) {
            recipientSocketIds.forEach((socketId) => {
              io.to(socketId).emit('typing:update', {
                userId,
                username: user.username,
                isTyping: false,
              });
            });
          }
        }
      });

      // ==================== ROOM EVENTS ====================

      /**
       * Join room
       */
      socket.on('room:join', async (data, callback) => {
        try {
          const { roomId } = data;

          const room = await Room.findById(roomId);
          if (!room) {
            return callback?.({ success: false, message: 'Room not found' });
          }

          // Check if user is already a member
          if (!room.isMember(userId)) {
            // For public rooms, auto-add
            if (room.roomType === 'public') {
              await room.addMember(userId);
            } else {
              return callback?.({
                success: false,
                message: 'You are not authorized to join this room',
              });
            }
          }

          socket.join(roomId);

          // Notify room members
          socket.to(roomId).emit('room:user:joined', {
            roomId,
            user: {
              id: userId,
              username: user.username,
              avatar: user.avatar,
            },
          });

          callback?.({ success: true, room: room.toObject() });
        } catch (error) {
          console.error('Error joining room:', error);
          callback?.({ success: false, message: error.message });
        }
      });

      /**
       * Leave room
       */
      socket.on('room:leave', async (data, callback) => {
        try {
          const { roomId } = data;

          socket.leave(roomId);

          // Notify room members
          socket.to(roomId).emit('room:user:left', {
            roomId,
            userId,
            username: user.username,
          });

          callback?.({ success: true });
        } catch (error) {
          console.error('Error leaving room:', error);
          callback?.({ success: false, message: error.message });
        }
      });

      // ==================== USER STATUS EVENTS ====================

      /**
       * Update user status
       */
      socket.on('user:status:update', async (data, callback) => {
        try {
          const { status, statusMessage } = data;

          await User.findByIdAndUpdate(userId, {
            status,
            statusMessage,
          });

          // Broadcast to all connections
          io.emit('user:status:changed', {
            userId,
            status,
            statusMessage,
          });

          callback?.({ success: true });
        } catch (error) {
          console.error('Error updating status:', error);
          callback?.({ success: false, message: error.message });
        }
      });

      // ==================== DISCONNECT HANDLER ====================

      /**
       * Handle disconnection
       */
      socket.on('disconnect', async () => {
        console.log(`❌ User disconnected: ${user.username} (${userId})`);

        try {
          // Remove socket from user's socket set
          const sockets = userSockets.get(userId);
          if (sockets) {
            sockets.delete(socket.id);
            
            // If no more sockets, user is completely offline
            if (sockets.size === 0) {
              userSockets.delete(userId);
              onlineUsers.delete(userId);

              // Update user status
              await User.findByIdAndUpdate(userId, {
                isOnline: false,
                status: 'offline',
                lastSeen: new Date(),
                socketId: null,
              });

              // Notify all users
              io.emit('user:offline', {
                userId,
                username: user.username,
                lastSeen: new Date(),
              });

              // Clear typing indicators
              typingUsers.forEach((usersSet, roomId) => {
                if (usersSet.has(userId)) {
                  usersSet.delete(userId);
                  io.to(roomId).emit('typing:update', {
                    roomId,
                    userId,
                    isTyping: false,
                  });
                }
              });
            }
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });

    } catch (error) {
      console.error('Error in socket connection:', error);
      socket.emit('error', { message: 'Connection error' });
      socket.disconnect();
    }
  });

  // Error handler
  io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
  });

  console.log('✅ Socket.io initialized');

  return io;
};

module.exports = {
  initializeSocketIO,
  onlineUsers,
  userSockets,
};