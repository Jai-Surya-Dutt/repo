const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  dimensions: {
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: ['selfie_cleanup', 'task_verification', 'environmental_action', 'achievement', 'profile'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'processing'],
    default: 'pending',
    index: true
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verificationMethod: {
      type: String,
      enum: ['automatic', 'manual', 'ai_analysis'],
      default: 'automatic'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    notes: {
      type: String,
      maxlength: [500, 'Verification notes cannot exceed 500 characters']
    }
  },
  location: {
    latitude: {
      type: Number,
      required: function() {
        return this.category === 'selfie_cleanup' || this.category === 'environmental_action';
      }
    },
    longitude: {
      type: Number,
      required: function() {
        return this.category === 'selfie_cleanup' || this.category === 'environmental_action';
      }
    },
    address: String,
    city: String,
    country: String,
    accuracy: Number // GPS accuracy in meters
  },
  metadata: {
    camera: {
      make: String,
      model: String,
      software: String
    },
    exif: {
      orientation: Number,
      flash: Number,
      whiteBalance: Number,
      exposureTime: String,
      fNumber: String,
      iso: Number,
      focalLength: String
    },
    weather: {
      temperature: Number,
      condition: String,
      humidity: Number,
      windSpeed: Number
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
photoSchema.index({ user: 1, category: 1 });
photoSchema.index({ status: 1, category: 1 });
photoSchema.index({ createdAt: -1 });
photoSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// Virtual for like count
photoSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for report count
photoSchema.virtual('reportCount').get(function() {
  return this.reports.length;
});

// Method to add like
photoSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  if (!existingLike) {
    this.likes.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove like
photoSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

// Method to add report
photoSchema.methods.addReport = function(userId, reason, description = '') {
  const existingReport = this.reports.find(report => report.user.toString() === userId.toString());
  if (!existingReport) {
    this.reports.push({
      user: userId,
      reason,
      description
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to verify photo
photoSchema.methods.verify = function(verifiedBy, method = 'manual', confidence = null, notes = '') {
  this.verification.isVerified = true;
  this.verification.verifiedAt = new Date();
  this.verification.verifiedBy = verifiedBy;
  this.verification.verificationMethod = method;
  this.verification.confidence = confidence;
  this.verification.notes = notes;
  this.status = 'verified';
  return this.save();
};

// Method to reject photo
photoSchema.methods.reject = function(verifiedBy, notes = '') {
  this.verification.isVerified = false;
  this.verification.verifiedAt = new Date();
  this.verification.verifiedBy = verifiedBy;
  this.verification.notes = notes;
  this.status = 'rejected';
  return this.save();
};

// Method to increment views
photoSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to get photos by category
photoSchema.statics.getByCategory = function(category, options = {}) {
  const {
    limit = 20,
    offset = 0,
    status = 'verified',
    isPublic = true
  } = options;
  
  const query = { category, status };
  if (isPublic) query.isPublic = true;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .populate('user', 'username profile.firstName profile.lastName');
};

// Static method to get user's photos
photoSchema.statics.getUserPhotos = function(userId, options = {}) {
  const {
    limit = 20,
    offset = 0,
    category = null,
    status = null
  } = options;
  
  const query = { user: userId };
  if (category) query.category = category;
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);
};

// Static method to get photos near location
photoSchema.statics.getNearLocation = function(latitude, longitude, maxDistance = 1000, options = {}) {
  const {
    limit = 20,
    category = null,
    status = 'verified'
  } = options;
  
  const query = {
    'location.latitude': {
      $gte: latitude - (maxDistance / 111), // Rough conversion: 1 degree ≈ 111 km
      $lte: latitude + (maxDistance / 111)
    },
    'location.longitude': {
      $gte: longitude - (maxDistance / (111 * Math.cos(latitude * Math.PI / 180))),
      $lte: longitude + (maxDistance / (111 * Math.cos(latitude * Math.PI / 180)))
    },
    status
  };
  
  if (category) query.category = category;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username profile.firstName profile.lastName');
};

module.exports = mongoose.model('Photo', photoSchema);
