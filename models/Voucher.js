const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Voucher name is required'],
    trim: true,
    maxlength: [100, 'Voucher name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Voucher description is required'],
    trim: true,
    maxlength: [500, 'Voucher description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed_amount', 'free_shipping', 'buy_one_get_one', 'cashback'],
    index: true
  },
  value: {
    type: Number,
    required: true,
    min: [0, 'Voucher value cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    maxlength: [3, 'Currency code must be 3 characters']
  },
  cost: {
    credits: {
      type: Number,
      required: true,
      min: [0, 'Credit cost cannot be negative']
    },
    cash: {
      type: Number,
      default: 0,
      min: [0, 'Cash cost cannot be negative']
    }
  },
  discount: {
    percentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100%']
    },
    maxAmount: {
      type: Number,
      min: [0, 'Maximum discount amount cannot be negative']
    },
    minPurchase: {
      type: Number,
      min: [0, 'Minimum purchase amount cannot be negative']
    }
  },
  validity: {
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  usage: {
    limit: {
      total: {
        type: Number,
        default: null, // null means unlimited
        min: [1, 'Total usage limit must be at least 1']
      },
      perUser: {
        type: Number,
        default: 1,
        min: [1, 'Per user usage limit must be at least 1']
      },
      used: {
        type: Number,
        default: 0,
        min: [0, 'Used count cannot be negative']
      }
    },
    restrictions: {
      newUsersOnly: {
        type: Boolean,
        default: false
      },
      minCredits: {
        type: Number,
        default: 0
      },
      categories: [{
        type: String,
        trim: true
      }],
      excludedCategories: [{
        type: String,
        trim: true
      }]
    }
  },
  partner: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: String,
    website: String,
    description: String
  },
  terms: {
    conditions: [{
      type: String,
      trim: true,
      maxlength: [200, 'Condition cannot exceed 200 characters']
    }],
    exclusions: [{
      type: String,
      trim: true,
      maxlength: [200, 'Exclusion cannot exceed 200 characters']
    }]
  },
  metadata: {
    category: {
      type: String,
      enum: ['shopping', 'food', 'travel', 'entertainment', 'health', 'education', 'other'],
      default: 'shopping'
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [20, 'Tag cannot exceed 20 characters']
    }],
    priority: {
      type: Number,
      default: 0,
      min: [0, 'Priority cannot be negative']
    },
    featured: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
voucherSchema.index({ code: 1 });
voucherSchema.index({ 'validity.isActive': 1, 'validity.endDate': 1 });
voucherSchema.index({ 'cost.credits': 1 });
voucherSchema.index({ 'metadata.category': 1 });
voucherSchema.index({ 'metadata.featured': 1 });

// Virtual for isExpired
voucherSchema.virtual('isExpired').get(function() {
  return this.validity.endDate < new Date();
});

// Virtual for isAvailable
voucherSchema.virtual('isAvailable').get(function() {
  return this.validity.isActive && 
         !this.isExpired && 
         (this.usage.limit.total === null || this.usage.limit.used < this.usage.limit.total);
});

// Virtual for remainingUses
voucherSchema.virtual('remainingUses').get(function() {
  if (this.usage.limit.total === null) return null;
  return Math.max(0, this.usage.limit.total - this.usage.limit.used);
});

// Method to check if user can use voucher
voucherSchema.methods.canUserUse = function(user, userCredits) {
  // Check if voucher is available
  if (!this.isAvailable) {
    return { canUse: false, reason: 'Voucher is not available' };
  }
  
  // Check if user has enough credits
  if (userCredits < this.cost.credits) {
    return { canUse: false, reason: 'Insufficient credits' };
  }
  
  // Check minimum credits requirement
  if (userCredits < this.usage.restrictions.minCredits) {
    return { canUse: false, reason: 'Minimum credits requirement not met' };
  }
  
  // Check if user is new (if restriction applies)
  if (this.usage.restrictions.newUsersOnly) {
    const userAge = Date.now() - user.createdAt.getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (userAge > thirtyDays) {
      return { canUse: false, reason: 'Voucher is for new users only' };
    }
  }
  
  return { canUse: true };
};

// Method to use voucher
voucherSchema.methods.use = function() {
  if (this.usage.limit.total !== null) {
    this.usage.limit.used += 1;
  }
  return this.save();
};

// Method to calculate discount amount
voucherSchema.methods.calculateDiscount = function(purchaseAmount) {
  if (this.type === 'percentage') {
    const discountAmount = (purchaseAmount * this.value) / 100;
    return this.discount.maxAmount ? 
      Math.min(discountAmount, this.discount.maxAmount) : 
      discountAmount;
  } else if (this.type === 'fixed_amount') {
    return Math.min(this.value, purchaseAmount);
  } else if (this.type === 'free_shipping') {
    return 0; // Free shipping is handled separately
  } else if (this.type === 'cashback') {
    return (purchaseAmount * this.value) / 100;
  }
  
  return 0;
};

// Static method to get available vouchers
voucherSchema.statics.getAvailable = function(options = {}) {
  const {
    category = null,
    maxCredits = null,
    featured = null,
    limit = 20,
    offset = 0
  } = options;
  
  const query = {
    'validity.isActive': true,
    'validity.endDate': { $gt: new Date() },
    $or: [
      { 'usage.limit.total': null },
      { $expr: { $lt: ['$usage.limit.used', '$usage.limit.total'] } }
    ]
  };
  
  if (category) query['metadata.category'] = category;
  if (maxCredits !== null) query['cost.credits'] = { $lte: maxCredits };
  if (featured !== null) query['metadata.featured'] = featured;
  
  return this.find(query)
    .sort({ 'metadata.priority': -1, createdAt: -1 })
    .limit(limit)
    .skip(offset);
};

// Static method to generate voucher code
voucherSchema.statics.generateCode = function(prefix = 'CS') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix;
  
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
};

// Pre-save middleware to generate code if not provided
voucherSchema.pre('save', function(next) {
  if (this.isNew && !this.code) {
    this.code = this.constructor.generateCode();
  }
  next();
});

module.exports = mongoose.model('Voucher', voucherSchema);
