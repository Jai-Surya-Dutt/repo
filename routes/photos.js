const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { body, query, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const fileStorage = require('../utils/fileStorage');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/photos';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `photo-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   POST /api/photos/upload
// @desc    Upload a selfie photo
// @access  Private
router.post('/upload', [
  auth,
  upload.single('photo'),
  body('category')
    .optional()
    .isIn(['beach_cleanup', 'street_cleanup', 'park_cleanup', 'river_cleanup', 'other'])
    .withMessage('Invalid category'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
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

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No photo uploaded'
      });
    }

    const { category = 'other', description = '' } = req.body;
    const userId = req.userId;

    // Process image with sharp
    const processedFilename = `processed-${req.file.filename}`;
    const processedPath = path.join('uploads/photos', processedFilename);
    
    await sharp(req.file.path)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(processedPath);

    // Delete original file
    fs.unlinkSync(req.file.path);

    // Create photo record
    const photo = fileStorage.createPhoto({
      user: userId,
      filename: processedFilename,
      originalName: req.file.originalname,
      path: processedPath,
      category,
      description,
      status: 'pending',
      metadata: {
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });

    // Award credits for photo upload
    const creditsAwarded = 10; // Base credits for photo upload
    const user = fileStorage.findUser({ _id: userId });
    if (user) {
      const newCredits = user.credits + creditsAwarded;
      fileStorage.updateUser(userId, { credits: newCredits });

      // Create transaction
      fileStorage.createTransaction({
        user: userId,
        type: 'photo_upload',
        category: 'earning',
        amount: creditsAwarded,
        description: `Photo upload: ${category}`,
        metadata: {
          photoId: photo._id,
          category: category
        },
        status: 'completed'
      });

      // Update user stats
      const newStats = {
        ...user.stats,
        totalCleanups: (user.stats?.totalCleanups || 0) + 1
      };
      fileStorage.updateUser(userId, { stats: newStats });
    }

    res.status(201).json({
      status: 'success',
      message: 'Photo uploaded successfully',
      data: { 
        photo,
        creditsAwarded,
        newBalance: user ? user.credits + creditsAwarded : 0
      }
    });

  } catch (error) {
    console.error('Upload photo error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload photo'
    });
  }
});

// @route   GET /api/photos
// @desc    Get user's photos
// @access  Private
router.get('/', [
  auth,
  query('category')
    .optional()
    .isIn(['beach_cleanup', 'street_cleanup', 'park_cleanup', 'river_cleanup', 'other'])
    .withMessage('Invalid category filter'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Invalid status filter'),
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

    const { category, status, limit = 20, offset = 0 } = req.query;
    const userId = req.userId;

    // Build query
    const query = { user: userId };
    if (category) query.category = category;
    if (status) query.status = status;

    // Get photos
    let photos = fileStorage.findPhotos(query);
    
    // Sort by creation date (newest first)
    photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const total = photos.length;
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    photos = photos.slice(startIndex, endIndex);

    res.json({
      status: 'success',
      message: 'Photos retrieved successfully',
      data: {
        photos,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: endIndex < total
        }
      }
    });

  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve photos'
    });
  }
});

// @route   GET /api/photos/:id
// @desc    Get a specific photo
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const photos = fileStorage.findPhotos({ user: userId });
    const photo = photos.find(p => p._id === id);

    if (!photo) {
      return res.status(404).json({
        status: 'error',
        message: 'Photo not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Photo retrieved successfully',
      data: { photo }
    });

  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve photo'
    });
  }
});

// @route   DELETE /api/photos/:id
// @desc    Delete a photo
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const photos = fileStorage.findPhotos({ user: userId });
    const photo = photos.find(p => p._id === id);

    if (!photo) {
      return res.status(404).json({
        status: 'error',
        message: 'Photo not found'
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(photo.path)) {
      fs.unlinkSync(photo.path);
    }

    // Update photo status to deleted
    fileStorage.updatePhoto(id, { status: 'deleted' });

    res.json({
      status: 'success',
      message: 'Photo deleted successfully'
    });

  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete photo'
    });
  }
});

module.exports = router;