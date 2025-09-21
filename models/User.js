const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    }
  },
  credits: {
    type: Number,
    default: 0,
    min: [0, 'Credits cannot be negative']
  },
  stats: {
    totalCleanups: {
      type: Number,
      default: 0
    },
    tasksCompleted: {
      type: Number,
      default: 0
    },
    environmentalImpact: {
      co2Saved: {
        type: Number,
        default: 0
      },
      wasteRecycled: {
        type: Number,
        default: 0
      },
      treesPlanted: {
        type: Number,
        default: 0
      }
    }
  },
  achievements: [{
    type: {
      type: String,
      enum: ['first_cleanup', 'task_master', 'eco_warrior', 'credit_collector', 'environmental_champion'],
      required: true
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ credits: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Add credits method
userSchema.methods.addCredits = function(amount, reason = '') {
  this.credits += amount;
  return this.save();
};

// Check if user can afford something
userSchema.methods.canAfford = function(cost) {
  return this.credits >= cost;
};

// Deduct credits method
userSchema.methods.deductCredits = function(amount, reason = '') {
  if (!this.canAfford(amount)) {
    throw new Error('Insufficient credits');
  }
  this.credits -= amount;
  return this.save();
};

// Update environmental impact
userSchema.methods.updateEnvironmentalImpact = function(action) {
  switch(action) {
    case 'cleanup':
      this.stats.environmentalImpact.co2Saved += 2;
      this.stats.environmentalImpact.wasteRecycled += 1;
      break;
    case 'recycle':
      this.stats.environmentalImpact.co2Saved += 5;
      this.stats.environmentalImpact.wasteRecycled += 3;
      break;
    case 'plant':
      this.stats.environmentalImpact.treesPlanted += 1;
      this.stats.environmentalImpact.co2Saved += 10;
      break;
    case 'energy':
      this.stats.environmentalImpact.co2Saved += 1;
      break;
  }
  return this.save();
};

// Check and unlock achievements
userSchema.methods.checkAchievements = async function() {
  const achievements = [];
  
  // First Cleanup
  if (this.stats.totalCleanups >= 1 && !this.achievements.some(a => a.type === 'first_cleanup')) {
    achievements.push({
      type: 'first_cleanup',
      description: 'Completed your first cleanup!'
    });
  }
  
  // Task Master
  if (this.stats.tasksCompleted >= 4 && !this.achievements.some(a => a.type === 'task_master')) {
    achievements.push({
      type: 'task_master',
      description: 'Completed all daily tasks!'
    });
  }
  
  // Eco Warrior
  if (this.credits >= 500 && !this.achievements.some(a => a.type === 'eco_warrior')) {
    achievements.push({
      type: 'eco_warrior',
      description: 'Earned 500+ credits!'
    });
  }
  
  // Credit Collector
  if (this.credits >= 1000 && !this.achievements.some(a => a.type === 'credit_collector')) {
    achievements.push({
      type: 'credit_collector',
      description: 'Earned 1000+ credits!'
    });
  }
  
  // Environmental Champion
  if (this.stats.environmentalImpact.co2Saved >= 100 && !this.achievements.some(a => a.type === 'environmental_champion')) {
    achievements.push({
      type: 'environmental_champion',
      description: 'Saved 100+ kg of CO₂!'
    });
  }
  
  if (achievements.length > 0) {
    this.achievements.push(...achievements);
    await this.save();
  }
  
  return achievements;
};

module.exports = mongoose.model('User', userSchema);
