/**
 * User Model
 * Handles user authentication and points system
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  
  // Points/Gamification
  points: {
    type: Number,
    default: 0,
  },
  
  // Point breakdown
  pointsBreakdown: {
    reportsCreated: { type: Number, default: 0 },
    confirmationsGiven: { type: Number, default: 0 },
    confirmationsReceived: { type: Number, default: 0 },
    photosAdded: { type: Number, default: 0 },
  },
  
  // User stats
  stats: {
    totalReports: { type: Number, default: 0 },
    totalConfirmations: { type: Number, default: 0 },
    totalPhotos: { type: Number, default: 0 },
  },
  
  // User level based on points
  level: {
    type: String,
    default: 'Explorer',
  },
  
  // Profile
  avatar: {
    type: String,
    default: null,
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

// Points configuration
const POINTS = {
  REPORT_CREATED: 1,
  CONFIRMATION_GIVEN: 1,
  CONFIRMATION_RECEIVED: 10,
  PHOTO_ADDED: 2,
  REPORT_CONFIRMED_BY_OTHERS: 10, // Per confirmation
};

// Level thresholds
const LEVELS = [
  { threshold: 0, name: 'Explorer' },
  { threshold: 50, name: 'Pathfinder' },
  { threshold: 150, name: 'Trailblazer' },
  { threshold: 300, name: 'Navigator' },
  { threshold: 500, name: 'Champion' },
  { threshold: 1000, name: 'Legend' },
];

// Hash password before saving
userSchema.pre('save', async function(next) {
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

// Update level based on points
userSchema.pre('save', function(next) {
  if (this.isModified('points')) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (this.points >= LEVELS[i].threshold) {
        this.level = LEVELS[i].name;
        break;
      }
    }
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Add points method
userSchema.methods.addPoints = async function(type, amount = null) {
  const pointsToAdd = amount || POINTS[type] || 0;
  this.points += pointsToAdd;
  
  // Update breakdown
  switch(type) {
    case 'REPORT_CREATED':
      this.pointsBreakdown.reportsCreated += pointsToAdd;
      this.stats.totalReports += 1;
      break;
    case 'CONFIRMATION_GIVEN':
      this.pointsBreakdown.confirmationsGiven += pointsToAdd;
      this.stats.totalConfirmations += 1;
      break;
    case 'CONFIRMATION_RECEIVED':
      this.pointsBreakdown.confirmationsReceived += pointsToAdd;
      break;
    case 'PHOTO_ADDED':
      this.pointsBreakdown.photosAdded += pointsToAdd;
      this.stats.totalPhotos += 1;
      break;
  }
  
  this.lastActive = new Date();
  return this.save();
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    id: this._id,
    username: this.username,
    points: this.points,
    level: this.level,
    stats: this.stats,
    createdAt: this.createdAt,
  };
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = async function(limit = 10) {
  return this.find({})
    .select('username points level stats.totalReports')
    .sort({ points: -1 })
    .limit(limit);
};

// Export points config for use elsewhere
userSchema.statics.POINTS = POINTS;
userSchema.statics.LEVELS = LEVELS;

module.exports = mongoose.model('User', userSchema);
