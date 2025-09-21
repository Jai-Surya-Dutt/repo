const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const fileStorage = require('../utils/fileStorage');

const router = express.Router();

// @route   GET /api/rewards/vouchers
// @desc    Get available vouchers
// @access  Public
router.get('/vouchers', [
  query('category')
    .optional()
    .isIn(['shopping', 'food', 'travel', 'entertainment', 'health', 'education', 'other'])
    .withMessage('Invalid category filter'),
  query('maxCredits')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max credits must be a non-negative integer'),
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { category, maxCredits, featured, limit = 20, offset = 0 } = req.query;

    // Build query
    const query = {};
    if (category) query.category = category;
    if (maxCredits) query.maxCredits = parseInt(maxCredits);
    if (featured !== undefined) query.featured = featured === 'true';

    // Get vouchers
    let vouchers = fileStorage.findVouchers(query);
    
    // Filter by validity
    vouchers = vouchers.filter(voucher => voucher.validity?.isActive === true);
    
    // Sort by priority and creation date
    vouchers.sort((a, b) => {
      const priorityA = a.metadata?.priority || 0;
      const priorityB = b.metadata?.priority || 0;
      if (priorityA !== priorityB) return priorityB - priorityA;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Apply pagination
    const total = vouchers.length;
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    vouchers = vouchers.slice(startIndex, endIndex);

    res.json({
      status: 'success',
      message: 'Vouchers retrieved successfully',
      data: {
        vouchers,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: endIndex < total
        }
      }
    });

  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve vouchers'
    });
  }
});

// @route   GET /api/rewards/vouchers/:id
// @desc    Get a specific voucher
// @access  Public
router.get('/vouchers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const vouchers = fileStorage.findVouchers();
    const voucher = vouchers.find(v => v._id === id);

    if (!voucher) {
      return res.status(404).json({
        status: 'error',
        message: 'Voucher not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Voucher retrieved successfully',
      data: { voucher }
    });

  } catch (error) {
    console.error('Get voucher error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve voucher'
    });
  }
});

// @route   POST /api/rewards/redeem
// @desc    Redeem a voucher
// @access  Private
router.post('/redeem', [
  auth,
  body('voucherId')
    .notEmpty()
    .withMessage('Voucher ID is required'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { voucherId, quantity = 1 } = req.body;
    const userId = req.userId;

    // Get user
    const user = fileStorage.findUser({ _id: userId });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get voucher
    const vouchers = fileStorage.findVouchers();
    const voucher = vouchers.find(v => v._id === voucherId);
    if (!voucher) {
      return res.status(404).json({
        status: 'error',
        message: 'Voucher not found'
      });
    }

    // Check if voucher is valid
    if (!voucher.validity?.isActive) {
      return res.status(400).json({
        status: 'error',
        message: 'Voucher is not active'
      });
    }

    const now = new Date();
    const startDate = new Date(voucher.validity.startDate);
    const endDate = new Date(voucher.validity.endDate);

    if (now < startDate || now > endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Voucher is expired or not yet active'
      });
    }

    // Check usage limits
    if (voucher.usage?.limit?.perUser && quantity > voucher.usage.limit.perUser) {
      return res.status(400).json({
        status: 'error',
        message: `Maximum ${voucher.usage.limit.perUser} vouchers per user allowed`
      });
    }

    // Calculate total cost
    const totalCost = voucher.cost?.credits * quantity;
    if (user.credits < totalCost) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient credits'
      });
    }

    // Deduct credits
    const newCredits = user.credits - totalCost;
    fileStorage.updateUser(userId, { credits: newCredits });

    // Create transaction record
    fileStorage.createTransaction({
      user: userId,
      type: 'voucher_redemption',
      category: 'spending',
      amount: -totalCost,
      description: `Redeemed ${quantity}x ${voucher.name}`,
      metadata: {
        voucherId: voucher._id,
        voucherName: voucher.name,
        quantity: quantity,
        unitCost: voucher.cost?.credits
      },
      status: 'completed'
    });

    // Update voucher usage
    const updatedVoucher = fileStorage.updateVoucher(voucherId, {
      'usage.limit.used': (voucher.usage?.limit?.used || 0) + quantity
    });

    res.json({
      status: 'success',
      message: 'Voucher redeemed successfully',
      data: {
        voucher: updatedVoucher,
        transaction: {
          amount: -totalCost,
          newBalance: newCredits
        }
      }
    });

  } catch (error) {
    console.error('Redeem voucher error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to redeem voucher'
    });
  }
});

// @route   GET /api/rewards/my-vouchers
// @desc    Get user's redeemed vouchers
// @access  Private
router.get('/my-vouchers', auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's voucher redemption transactions
    const transactions = fileStorage.findTransactions({ 
      user: userId, 
      type: 'voucher_redemption' 
    });

    // Get voucher details for each transaction
    const vouchers = fileStorage.findVouchers();
    const myVouchers = transactions.map(transaction => {
      const voucher = vouchers.find(v => v._id === transaction.metadata?.voucherId);
      return {
        ...transaction,
        voucher: voucher ? {
          name: voucher.name,
          description: voucher.description,
          code: voucher.code,
          partner: voucher.partner
        } : null
      };
    });

    res.json({
      status: 'success',
      message: 'User vouchers retrieved successfully',
      data: { vouchers: myVouchers }
    });

  } catch (error) {
    console.error('Get my vouchers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user vouchers'
    });
  }
});

module.exports = router;