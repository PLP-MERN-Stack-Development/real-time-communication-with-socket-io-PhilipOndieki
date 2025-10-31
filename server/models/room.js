// models/Room.js - Room/Channel model for group chats

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      minlength: [3, 'Room name must be at least 3 characters'],
      maxlength: [50, 'Room name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    roomType: {
      type: String,
      enum: ['public', 'private', 'direct'],
      default: 'public',
    },
    avatar: {
      type: String,
      default: 'https://ui-avatars.com/api/?background=random&name=Room',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        enum: ['admin', 'moderator', 'member'],
        default: 'member',
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      lastRead: {
        type: Date,
        default: Date.now,
      },
      unreadCount: {
        type: Number,
        default: 0,
      },
    }],
    admins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    settings: {
      allowFileSharing: {
        type: Boolean,
        default: true,
      },
      maxMembers: {
        type: Number,
        default: 100,
      },
      isEncrypted: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
roomSchema.index({ name: 1, roomType: 1 });
roomSchema.index({ members: 1 });
roomSchema.index({ creator: 1 });
roomSchema.index({ lastActivity: -1 });

// Virtual for member count
roomSchema.virtual('memberCount').get(function () {
  return this.members ? this.members.length : 0;
});

// Method to add member
roomSchema.methods.addMember = function (userId, role = 'member') {
  const existingMember = this.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    throw new Error('User is already a member');
  }
  
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
  });
  
  return this.save();
};

// Method to remove member
roomSchema.methods.removeMember = function (userId) {
  this.members = this.members.filter(
    (m) => m.user.toString() !== userId.toString()
  );
  
  // Remove from admins if present
  this.admins = this.admins.filter(
    (adminId) => adminId.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to promote to admin
roomSchema.methods.promoteToAdmin = function (userId) {
  const member = this.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  
  if (!member) {
    throw new Error('User is not a member');
  }
  
  member.role = 'admin';
  
  if (!this.admins.includes(userId)) {
    this.admins.push(userId);
  }
  
  return this.save();
};

// Method to check if user is member
roomSchema.methods.isMember = function (userId) {
  return this.members.some(
    (m) => m.user.toString() === userId.toString()
  );
};

// Method to check if user is admin
roomSchema.methods.isAdmin = function (userId) {
  return this.admins.some(
    (adminId) => adminId.toString() === userId.toString()
  ) || this.creator.toString() === userId.toString();
};

// Method to update unread count
roomSchema.methods.updateUnreadCount = function (userId, increment = true) {
  const member = this.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  
  if (member) {
    if (increment) {
      member.unreadCount += 1;
    } else {
      member.unreadCount = 0;
      member.lastRead = new Date();
    }
  }
  
  return this.save();
};

// Static method to get user's rooms
roomSchema.statics.getUserRooms = function (userId) {
  return this.find({
    'members.user': userId,
    isActive: true,
  })
    .sort({ lastActivity: -1 })
    .populate('creator', 'username avatar')
    .populate('members.user', 'username avatar status isOnline')
    .populate('lastMessage');
};

// Static method to get public rooms
roomSchema.statics.getPublicRooms = function () {
  return this.find({
    roomType: 'public',
    isActive: true,
  })
    .sort({ memberCount: -1, lastActivity: -1 })
    .populate('creator', 'username avatar')
    .limit(50);
};

// Pre-save middleware to update lastActivity
roomSchema.pre('save', function (next) {
  this.lastActivity = new Date();
  next();
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;