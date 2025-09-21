const express = require('express');
const { query, body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const fileStorage = require('../utils/fileStorage');

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get user's transaction history
// @access  Private
router.get('/', [
  auth,
  query('type')
    .optional()
    .isIn(['earning', 'spending', 'transfer', 'bonus', 'penalty'])
    .withMessage('Invalid transaction type'),
  query('category')
    .optional()
    .isIn(['earning', 'spending'])
    .withMessage('Invalid transaction category'),
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'cancelled'])
    .withMessage('Invalid transaction status'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
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

    const { 
      type, 
      category, 
      status, 
      limit = 20, 
      offset = 0, 
      startDate, 
      endDate 
    } = req.query;
    const userId = req.userId;

    // Build query
    const query = { user: userId };
    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;

    // Get transactions
    let transactions = fileStorage.findTransactions(query);
    
    // Filter by date range if provided
    if (startDate || endDate) {
      transactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        if (startDate && transactionDate < new Date(startDate)) return false;
        if (endDate && transactionDate > new Date(endDate)) return false;
        return true;
      });
    }
    
    // Sort by creation date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const total = transactions.length;
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    transactions = transactions.slice(startIndex, endIndex);

    res.json({
      status: 'success',
      message: 'Transactions retrieved successfully',
      data: {
        transactions,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: endIndex < total
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve transactions'
    });
  }
});

// @route   GET /api/transactions/stats
// @desc    Get transaction statistics
// @access  Private
router.get('/stats', [
  auth,
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year', 'all'])
    .withMessage('Invalid period filter')
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

    const { period = 'all' } = req.query;
    const userId = req.userId;

    // Get all user transactions
    let transactions = fileStorage.findTransactions({ user: userId });

    // Filter by period if specified
    if (period !== 'all') {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      if (startDate) {
        transactions = transactions.filter(t => new Date(t.createdAt) >= startDate);
      }
    }

    // Calculate statistics
    const stats = {
      totalTransactions: transactions.length,
      totalEarned: transactions
        .filter(t => t.category === 'earning')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      totalSpent: transactions
        .filter(t => t.category === 'spending')
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0),
      averageTransactionAmount: transactions.length > 0 ? 
        transactions.reduce((sum, t) => sum + (t.amount || 0), 0) / transactions.length : 0,
      lastTransactionDate: transactions.length > 0 ? 
        transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt : null,
      transactionTypes: {
        earning: transactions.filter(t => t.category === 'earning').length,
        spending: transactions.filter(t => t.category === 'spending').length,
        transfer: transactions.filter(t => t.type === 'transfer').length,
        bonus: transactions.filter(t => t.type === 'bonus').length,
        penalty: transactions.filter(t => t.type === 'penalty').length
      }
    };

    res.json({
      status: 'success',
      message: 'Transaction statistics retrieved successfully',
      data: { stats }
    });

  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve transaction statistics'
    });
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private
router.post('/', [
  auth,
  body('type')
    .isIn(['earning', 'spending', 'transfer', 'bonus', 'penalty'])
    .withMessage('Invalid transaction type'),
  body('category')
    .isIn(['earning', 'spending'])
    .withMessage('Invalid transaction category'),
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number'),
  body('description')
    .notEmpty()
    .withMessage('Description is required'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
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

    const { type, category, amount, description, metadata = {} } = req.body;
    const userId = req.userId;

    // Create transaction
    const transaction = fileStorage.createTransaction({
      user: userId,
      type,
      category,
      amount: parseFloat(amount),
      description,
      metadata,
      status: 'completed'
    });

    res.status(201).json({
      status: 'success',
      message: 'Transaction created successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create transaction'
    });
  }
});

module.exports = router;