const API_BASE_URL = 'http://localhost:5000/api/';
const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const fileStorage = require('../utils/fileStorage');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Middleware for authenticating JWT token directly in this file
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
};

const WELCOME_CREDITS = 100;

// @route   POST /api/auth/register
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters')
    .trim(),
  body('lastName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters')
    .trim()
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

    const { username, email, password, firstName, lastName } = req.body;

    const existingUserByEmail = fileStorage.findUser({ email });
    const existingUserByUsername = fileStorage.findUser({ username });

    if (existingUserByEmail || existingUserByUsername) {
      return res.status(400).json({
        status: 'error',
        message: existingUserByEmail ? 'Email already registered' : 'Username already taken'
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = fileStorage.createUser({
      username,
      email,
      password: hashedPassword,
      profile: {
        firstName: firstName || '',
        lastName: lastName || ''
      },
      credits: WELCOME_CREDITS,
      stats: {
        totalCleanups: 0,
        tasksCompleted: 0,
        environmentalImpact: {
          co2Saved: 0,
          wasteRecycled: 0,
          treesPlanted: 0
        }
      },
      achievements: [],
      isActive: true,
      lastLogin: new Date().toISOString()
    });

    const token = generateToken(user._id);

    fileStorage.updateUser(user._id, { lastLogin: new Date().toISOString() });

    const { password: _, ...userResponse } = user;

    res.status(201).json({
      status: 'success',
      message: `User registered successfully. ${WELCOME_CREDITS} credits have been added to your account.`,
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
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

    const { email, password } = req.body;

    const user = fileStorage.findUser({ email });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated. Please contact support.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    fileStorage.updateUser(user._id, { lastLogin: new Date().toISOString() });

    const { password: _, ...userResponse } = user;

    if (typeof userResponse.credits !== 'number') {
      userResponse.credits = 0;
    }

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/verify
router.post('/verify', authenticate, async (req, res) => {
  try {
    const user = fileStorage.findUser({ _id: req.userId });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated'
      });
    }

    const { password: _, ...userResponse } = user;

    if (typeof userResponse.credits !== 'number') {
      userResponse.credits = 0;
    }

    res.json({
      status: 'success',
      message: 'Token is valid',
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during token verification'
    });
  }
});

// @route   POST /api/auth/refresh
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const user = fileStorage.findUser({ _id: req.userId });
    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found or inactive'
      });
    }

    const token = generateToken(user._id);

    res.json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        token
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during token refresh'
    });
  }
});

// @route   POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  res.json({
    status: 'success',
    message: 'Logout successful'
  });
});

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
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

    const { email } = req.body;

    const user = fileStorage.findUser({ email });
    if (!user) {
      return res.json({
        status: 'success',
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    );

    res.json({
      status: 'success',
      message: 'If the email exists, a password reset link has been sent',
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during password reset request'
    });
  }
});

// @route   POST /api/auth/reset-password
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
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

    const { token, password } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (err) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      });
    }

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid reset token'
      });
    }

    const user = fileStorage.findUser({ _id: decoded.userId });
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    fileStorage.updateUser(user._id, { password: hashedPassword });

    res.json({
      status: 'success',
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during password reset'
    });
  }
});

module.exports = router;
