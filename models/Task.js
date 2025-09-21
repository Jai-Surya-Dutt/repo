const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['recycle', 'plant', 'cleanup', 'energy', 'custom'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Task title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    maxlength: [500, 'Task description cannot exceed 500 characters']
  },
  target: {
    type: Number,
    required: true,
    min: [1, 'Target must be at least 1']
  },
  current: {
    type: Number,
    default: 0,
    min: [0, 'Current progress cannot be negative']
  },
  reward: {
    credits: {
      type: Number,
      required: true,
      min: [0, 'Credit reward cannot be negative']
    },
    experience: {
      type: Number,
      default: 0,
      min: [0, 'Experience reward cannot be negative']
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired', 'cancelled'],
    default: 'active',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['environmental', 'social', 'educational', 'health', 'community'],
    default: 'environmental'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  dueDate: {
    type: Date,
    default: function() {
      // Default to 24 hours from creation
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },
  completedAt: {
    type: Date,
    default: null
  },
  verification: {
    required: {
      type: Boolean,
      default: false
    },
    method: {
      type: String,
      enum: ['photo', 'location', 'witness', 'automatic'],
      default: 'automatic'
    },
    evidence: [{
      type: {
        type: String,
        enum: ['photo', 'location', 'text', 'file']
      },
      url: String,
      description: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  metadata: {
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
      city: String,
      country: String
    },
    weather: {
      temperature: Number,
      condition: String,
      humidity: Number
    },
    duration: Number, // in minutes
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      default: 'medium'
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ type: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });

// Virtual for progress percentage
taskSchema.virtual('progressPercentage').get(function() {
  return Math.round((this.current / this.target) * 100);
});

// Virtual for isOverdue
taskSchema.virtual('isOverdue').get(function() {
  return this.status === 'active' && this.dueDate < new Date();
});

// Method to update progress
taskSchema.methods.updateProgress = function(increment = 1) {
  this.current = Math.min(this.current + increment, this.target);
  
  if (this.current >= this.target && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Method to reset task
taskSchema.methods.reset = function() {
  this.current = 0;
  this.status = 'active';
  this.completedAt = null;
  this.verification.evidence = [];
  return this.save();
};

// Method to add verification evidence
taskSchema.methods.addEvidence = function(evidence) {
  this.verification.evidence.push({
    ...evidence,
    uploadedAt: new Date()
  });
  return this.save();
};

// Static method to get user's active tasks
taskSchema.statics.getActiveTasks = function(userId) {
  return this.find({
    user: userId,
    status: 'active',
    dueDate: { $gt: new Date() }
  }).sort({ priority: -1, createdAt: -1 });
};

// Static method to get completed tasks
taskSchema.statics.getCompletedTasks = function(userId, limit = 10) {
  return this.find({
    user: userId,
    status: 'completed'
  }).sort({ completedAt: -1 }).limit(limit);
};

// Static method to get overdue tasks
taskSchema.statics.getOverdueTasks = function(userId) {
  return this.find({
    user: userId,
    status: 'active',
    dueDate: { $lt: new Date() }
  }).sort({ dueDate: 1 });
};

// Pre-save middleware to validate progress
taskSchema.pre('save', function(next) {
  if (this.current > this.target) {
    this.current = this.target;
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
