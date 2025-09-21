const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const fileStorage = require('../utils/fileStorage');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/videos';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// @route   POST /api/videos/upload
// @desc    Upload video for environmental action
// @access  Private
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  try {
    console.log('Video upload request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('User ID:', req.userId);

    if (!req.file) {
      console.log('No video file provided');
      return res.status(400).json({
        status: 'error',
        message: 'No video file provided'
      });
    }

    const { actionType, description } = req.body;
    
    // Validate action type
    const validActionTypes = ['selfie-clean', 'recycle', 'plant', 'cleanup', 'energy'];
    if (!actionType || !validActionTypes.includes(actionType)) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid action type'
      });
    }

    // Calculate credits based on action type
    const creditRewards = {
      'selfie-clean': 10,
      'recycle': 50,
      'plant': 100,
      'cleanup': 75,
      'energy': 30
    };

    const creditsEarned = creditRewards[actionType];

    // Create video record
    const videoData = {
      _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: req.userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      actionType: actionType,
      description: description || '',
      creditsEarned: creditsEarned,
      status: 'pending', // pending, approved, rejected
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null
    };

    // Save video record to file storage
    const videos = fileStorage.getVideos();
    videos.push(videoData);
    fileStorage.saveVideos(videos);

    // Update user credits
    const user = fileStorage.findUser({ _id: req.userId });
    if (user) {
      user.credits = (user.credits || 0) + creditsEarned;
      
      // Update stats based on action type
      if (actionType === 'selfie-clean') {
        user.stats.totalCleanups = (user.stats.totalCleanups || 0) + 1;
      } else if (actionType === 'recycle') {
        user.stats.environmentalImpact.wasteRecycled = (user.stats.environmentalImpact.wasteRecycled || 0) + 1;
      } else if (actionType === 'plant') {
        user.stats.environmentalImpact.treesPlanted = (user.stats.environmentalImpact.treesPlanted || 0) + 1;
      } else if (actionType === 'cleanup') {
        user.stats.environmentalImpact.co2Saved = (user.stats.environmentalImpact.co2Saved || 0) + 0.5;
      } else if (actionType === 'energy') {
        user.stats.environmentalImpact.co2Saved = (user.stats.environmentalImpact.co2Saved || 0) + 0.2;
      }
      
      user.stats.tasksCompleted = (user.stats.tasksCompleted || 0) + 1;
      user.updatedAt = new Date().toISOString();
      
      fileStorage.updateUser(req.userId, user);
    }

    const responseData = {
      status: 'success',
      message: `Video uploaded successfully! You earned ${creditsEarned} credits.`,
      data: {
        video: {
          id: videoData._id,
          filename: videoData.filename,
          actionType: videoData.actionType,
          creditsEarned: videoData.creditsEarned,
          submittedAt: videoData.submittedAt
        },
        user: {
          credits: user.credits,
          stats: user.stats
        }
      }
    };

    console.log('Sending success response:', JSON.stringify(responseData, null, 2));
    res.status(201).json(responseData);

  } catch (error) {
    console.error('Video upload error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error during video upload'
    });
  }
});

// @route   GET /api/videos/user
// @desc    Get user's uploaded videos
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const videos = fileStorage.getVideos();
    const userVideos = videos.filter(video => video.userId === req.userId);
    
    // Remove sensitive information
    const sanitizedVideos = userVideos.map(video => ({
      id: video._id,
      filename: video.filename,
      actionType: video.actionType,
      description: video.description,
      creditsEarned: video.creditsEarned,
      status: video.status,
      submittedAt: video.submittedAt,
      reviewedAt: video.reviewedAt
    }));

    res.json({
      status: 'success',
      data: {
        videos: sanitizedVideos
      }
    });

  } catch (error) {
    console.error('Get user videos error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching videos'
    });
  }
});

// @route   GET /api/videos/:id
// @desc    Get specific video details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const videos = fileStorage.getVideos();
    const video = videos.find(v => v._id === req.params.id);
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }

    // Check if user owns the video or is admin
    if (video.userId !== req.userId && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.json({
      status: 'success',
      data: {
        video: {
          id: video._id,
          filename: video.filename,
          actionType: video.actionType,
          description: video.description,
          creditsEarned: video.creditsEarned,
          status: video.status,
          submittedAt: video.submittedAt,
          reviewedAt: video.reviewedAt
        }
      }
    });

  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching video'
    });
  }
});

// @route   GET /api/videos/:id/stream
// @desc    Stream video file
// @access  Private
router.get('/:id/stream', auth, async (req, res) => {
  try {
    const videos = fileStorage.getVideos();
    const video = videos.find(v => v._id === req.params.id);
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }

    // Check if user owns the video or is admin
    if (video.userId !== req.userId && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const videoPath = path.join(__dirname, '..', video.path);
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        status: 'error',
        message: 'Video file not found'
      });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.mimetype,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': video.mimetype,
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }

  } catch (error) {
    console.error('Stream video error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while streaming video'
    });
  }
});

module.exports = router;
