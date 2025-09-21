const mongoose = require('mongoose');
const crypto = require('crypto');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  hash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'selfie_cleanup',
      'task_completion',
      'voucher_redemption',
      'credit_purchase',
      'bonus_credit',
      'penalty',
      'refund',
      'transfer'
    ],
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['earning', 'spending', 'bonus', 'penalty'],
    index: true
  },
  amount: {
    type: Number,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'cancelled'],
    default: 'confirmed',
    index: true
  },
  blockNumber: {
    type: Number,
    required: true,
    index: true
  },
  previousHash: {
    type: String,
    default: null
  },
  nonce: {
    type: Number,
    default: 0
  },
  metadata: {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null
    },
    photoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Photo',
      default: null
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      default: null
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    environmentalImpact: {
      co2Saved: Number,
      wasteRecycled: Number,
      treesPlanted: Number
    },
    verification: {
      method: String,
      verified: {
        type: Boolean,
        default: false
      },
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  fees: {
    network: {
      type: Number,
      default: 0
    },
    processing: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  confirmationCount: {
    type: Number,
    default: 1
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Transactions expire after 24 hours if not confirmed
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ blockNumber: -1 });
transactionSchema.index({ createdAt: -1 });

// Virtual for transaction age
transactionSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for isExpired
transactionSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date() && this.status === 'pending';
});

// Static method to generate transaction hash
transactionSchema.statics.generateHash = function(data) {
  const dataString = JSON.stringify({
    user: data.user,
    type: data.type,
    amount: data.amount,
    timestamp: data.timestamp || Date.now(),
    nonce: data.nonce || Math.random()
  });
  
  return crypto.createHash('sha256').update(dataString).digest('hex');
};

// Static method to get next block number
transactionSchema.statics.getNextBlockNumber = async function() {
  const lastTransaction = await this.findOne({}, {}, { sort: { blockNumber: -1 } });
  return lastTransaction ? lastTransaction.blockNumber + 1 : 1;
};

// Static method to get user's transaction history
transactionSchema.statics.getUserHistory = function(userId, options = {}) {
  const {
    limit = 20,
    offset = 0,
    type = null,
    status = null,
    startDate = null,
    endDate = null
  } = options;
  
  const query = { user: userId };
  
  if (type) query.type = type;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .populate('metadata.taskId', 'title type')
    .populate('metadata.photoId', 'url description');
};

// Static method to get transaction statistics
transactionSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalEarned: {
          $sum: {
            $cond: [
              { $eq: ['$category', 'earning'] },
              '$amount',
              0
            ]
          }
        },
        totalSpent: {
          $sum: {
            $cond: [
              { $eq: ['$category', 'spending'] },
              { $abs: '$amount' },
              0
            ]
          }
        },
        avgTransactionAmount: { $avg: '$amount' },
        lastTransactionDate: { $max: '$createdAt' }
      }
    }
  ]);
  
  return stats[0] || {
    totalTransactions: 0,
    totalEarned: 0,
    totalSpent: 0,
    avgTransactionAmount: 0,
    lastTransactionDate: null
  };
};

// Method to confirm transaction
transactionSchema.methods.confirm = function() {
  this.status = 'confirmed';
  this.confirmationCount += 1;
  return this.save();
};

// Method to fail transaction
transactionSchema.methods.fail = function(reason) {
  this.status = 'failed';
  this.metadata.verification.verified = false;
  return this.save();
};

// Method to cancel transaction
transactionSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Pre-save middleware to generate hash and block number
transactionSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate hash if not provided
    if (!this.hash) {
      this.hash = this.constructor.generateHash({
        user: this.user,
        type: this.type,
        amount: this.amount,
        timestamp: this.createdAt || Date.now()
      });
    }
    
    // Get next block number if not provided
    if (!this.blockNumber) {
      this.blockNumber = await this.constructor.getNextBlockNumber();
    }
    
    // Calculate total fees
    this.fees.total = this.fees.network + this.fees.processing;
  }
  
  next();
});

// Post-save middleware to update user credits
transactionSchema.post('save', async function() {
  if (this.status === 'confirmed') {
    const User = mongoose.model('User');
    const user = await User.findById(this.user);
    
    if (user) {
      if (this.category === 'earning') {
        await user.addCredits(this.amount, this.description);
      } else if (this.category === 'spending') {
        await user.deductCredits(Math.abs(this.amount), this.description);
      }
    }
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
