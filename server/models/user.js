// models/User.js - User model for authentication and profile management

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    avatar: {
      type: String,
      default: 'https://ui-avatars.com/api/?background=random&name=User',
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away', 'busy'],
      default: 'offline',
    },
    statusMessage: {
      type: String,
      maxlength: [100, 'Status message cannot exceed 100 characters'],
      default: '',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketId: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    blockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
userSchema.index({ isOnline: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    avatar: this.avatar,
    status: this.status,
    statusMessage: this.statusMessage,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
    role: this.role,
    createdAt: this.createdAt,
  };
};

// Static method to find online users
userSchema.statics.findOnlineUsers = function () {
  return this.find({ isOnline: true }).select('username avatar status');
};

// Update lastSeen before any update operation
userSchema.pre('findOneAndUpdate', function (next) {
  this.set({ lastSeen: new Date() });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;