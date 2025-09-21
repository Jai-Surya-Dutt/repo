const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const fileStorage = require('../utils/fileStorage');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = fileStorage.findUser({ _id: req.userId });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.json({
      status: 'success',
      message: 'Profile retrieved successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('profile.firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('profile.lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('profile.bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  body('profile.location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters')
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

    const { profile } = req.body;
    const userId = req.userId;

    // Update user profile
    const updatedUser = fileStorage.updateUser(userId, { profile });
    
    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Remove password from response
    const { password: _, ...userResponse } = updatedUser;

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const user = fileStorage.findUser({ _id: userId });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get user statistics
    const stats = fileStorage.getUserStats(userId);
    
    // Get additional stats from user data
    const userStats = {
      ...stats,
      credits: user.credits,
      totalCleanups: user.stats?.totalCleanups || 0,
      tasksCompleted: user.stats?.tasksCompleted || 0,
      environmentalImpact: user.stats?.environmentalImpact || {
        co2Saved: 0,
        wasteRecycled: 0,
        treesPlanted: 0
      },
      achievements: user.achievements || [],
      joinDate: user.createdAt,
      lastLogin: user.lastLogin
    };

    res.json({
      status: 'success',
      message: 'User statistics retrieved successfully',
      data: { stats: userStats }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user statistics'
    });
  }
});

// @route   GET /api/users/achievements
// @desc    Get user achievements
// @access  Private
router.get('/achievements', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const user = fileStorage.findUser({ _id: userId });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const achievements = user.achievements || [];

    res.json({
      status: 'success',
      message: 'Achievements retrieved successfully',
      data: { achievements }
    });

  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve achievements'
    });
  }
});

// @route   POST /api/users/achievements
// @desc    Add achievement to user
// @access  Private
router.post('/achievements', [
  auth,
  body('achievementId')
    .notEmpty()
    .withMessage('Achievement ID is required'),
  body('title')
    .notEmpty()
    .withMessage('Achievement title is required'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('points')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Points must be a non-negative integer')
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

    const { achievementId, title, description, points = 0 } = req.body;
    const userId = req.userId;

    const user = fileStorage.findUser({ _id: userId });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if achievement already exists
    const existingAchievement = user.achievements?.find(a => a.achievementId === achievementId);
    if (existingAchievement) {
      return res.status(400).json({
        status: 'error',
        message: 'Achievement already exists'
      });
    }

    // Add achievement
    const newAchievement = {
      achievementId,
      title,
      description,
      points,
      earnedAt: new Date().toISOString()
    };

    const updatedAchievements = [...(user.achievements || []), newAchievement];
    fileStorage.updateUser(userId, { achievements: updatedAchievements });

    res.json({
      status: 'success',
      message: 'Achievement added successfully',
      data: { achievement: newAchievement }
    });

  } catch (error) {
    console.error('Add achievement error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add achievement'
    });
  }
});

module.exports = router;