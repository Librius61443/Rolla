/**
 * Report Model
 * Stores accessibility feature reports with location, photos, and confirmation tracking
 */

const mongoose = require('mongoose');

// Schema for individual photos
const photoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  reporterId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  badPhotoReports: [{
    reporterId: String,
    reason: String,
    createdAt: { type: Date, default: Date.now },
  }],
  isHidden: {
    type: Boolean,
    default: false,
  },
});

// Schema for confirmations (people saying it's there)
const confirmationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Schema for removal reports (people saying it's gone)
const removalReportSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Main Report schema
const reportSchema = new mongoose.Schema({
  // Type of accessibility feature
  type: {
    type: String,
    required: true,
    enum: [
      'elevator',
      'ramp',
      'accessible_table',
      'wheelchair_entrance',
      'accessible_parking',
      'accessible_restroom',
      'braille_signage',
      'audio_signals',
      'lowered_counter',
      'automatic_doors',
      'tactile_paving',
      'service_animal',
    ],
  },
  
  // GeoJSON location for geospatial queries
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  
  // Original reporter
  creatorId: {
    type: String,
    required: true,
  },
  
  // Photos of the feature
  photos: [photoSchema],
  
  // Confirmations from other users
  confirmations: [confirmationSchema],
  
  // Removal reports from users
  removalReports: [removalReportSchema],
  
  // Status of the report
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'permanent', 'removed'],
    default: 'pending',
  },
  
  // Whether this report is permanent (10+ confirmations)
  isPermanent: {
    type: Boolean,
    default: false,
  },
  
  // Expiry date (null if permanent)
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiry is 48 hours from creation
      return new Date(Date.now() + 48 * 60 * 60 * 1000);
    },
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create geospatial index for location queries
reportSchema.index({ location: '2dsphere' });

// Index for expiry queries
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for status queries
reportSchema.index({ status: 1 });

// Pre-save middleware to update timestamps and status
reportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update status based on confirmations
  const confirmationCount = this.confirmations.length;
  const removalCount = this.removalReports.length;
  
  // Check if should be marked as removed
  if (removalCount >= 10) {
    this.status = 'removed';
  }
  // Check if should be permanent (10+ confirmations)
  else if (confirmationCount >= 10 && !this.isPermanent) {
    this.isPermanent = true;
    this.status = 'permanent';
    this.expiresAt = null; // Never expires
  }
  // Check if confirmed (at least 1 other person confirmed)
  else if (confirmationCount >= 1 && this.status === 'pending') {
    this.status = 'confirmed';
    // Extend expiry by 24 hours for each confirmation (up to a limit)
    const extensionHours = Math.min(confirmationCount * 24, 7 * 24); // Max 7 days
    this.expiresAt = new Date(Date.now() + extensionHours * 60 * 60 * 1000);
  }
  
  next();
});

// Method to get confirmation count
reportSchema.methods.getConfirmationCount = function() {
  return this.confirmations.length;
};

// Method to get the primary photo (first non-hidden photo)
reportSchema.methods.getPrimaryPhoto = function() {
  return this.photos.find(p => !p.isHidden) || this.photos[0];
};

// Static method to find reports near a location
reportSchema.statics.findNearby = function(longitude, latitude, maxDistanceMeters = 1000) {
  return this.find({
    status: { $ne: 'removed' },
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  });
};

// Static method to find duplicate reports (same type within 20 meters)
reportSchema.statics.findDuplicate = function(type, longitude, latitude) {
  return this.findOne({
    type,
    status: { $ne: 'removed' },
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: 20, // 20 meters threshold for "same location"
      },
    },
  });
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
