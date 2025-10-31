// models/Message.js - Message model for chat messages

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null, // null for direct messages
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // For direct/private messages
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'audio', 'video'],
      default: 'text',
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileMetadata: {
      name: String,
      size: Number,
      mimeType: String,
      publicId: String, // Cloudinary public ID for deletion
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
    deliveredTo: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      deliveredAt: {
        type: Date,
        default: Date.now,
      },
    }],
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      emoji: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ content: 'text' }); // Text search index

// Virtual for checking if message is read
messageSchema.virtual('isRead').get(function () {
  return this.readBy && this.readBy.length > 0;
});

// Method to add reaction
messageSchema.methods.addReaction = function (userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(
    (r) => r.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji: emoji,
  });
  
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function (userId) {
  this.reactions = this.reactions.filter(
    (r) => r.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to mark as read
messageSchema.methods.markAsRead = function (userId) {
  const alreadyRead = this.readBy.some(
    (r) => r.user.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date(),
    });
  }
  
  return this.save();
};

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function (userId) {
  const alreadyDelivered = this.deliveredTo.some(
    (d) => d.user.toString() === userId.toString()
  );
  
  if (!alreadyDelivered) {
    this.deliveredTo.push({
      user: userId,
      deliveredAt: new Date(),
    });
  }
  
  return this.save();
};

// Static method to get room messages with pagination
messageSchema.statics.getRoomMessages = function (roomId, page = 1, limit = 50) {
  return this.find({ room: roomId, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'username avatar status')
    .populate('replyTo');
};

// Static method to get direct messages between two users
messageSchema.statics.getDirectMessages = function (user1Id, user2Id, page = 1, limit = 50) {
  return this.find({
    $or: [
      { sender: user1Id, recipient: user2Id },
      { sender: user2Id, recipient: user1Id },
    ],
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'username avatar status');
};

// Static method to search messages
messageSchema.statics.searchMessages = function (query, userId, roomId = null) {
  const searchQuery = {
    $text: { $search: query },
    isDeleted: false,
  };
  
  if (roomId) {
    searchQuery.room = roomId;
  } else {
    searchQuery.$or = [
      { sender: userId },
      { recipient: userId },
    ];
  }
  
  return this.find(searchQuery)
    .sort({ score: { $meta: 'textScore' } })
    .limit(50)
    .populate('sender', 'username avatar');
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;