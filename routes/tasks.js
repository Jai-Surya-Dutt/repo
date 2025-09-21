const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const fileStorage = require('../utils/fileStorage');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get user's tasks
// @access  Private
router.get('/', [
  auth,
  query('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status filter'),
  query('type')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'special'])
    .withMessage('Invalid type filter'),
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

    const { status, type, limit = 20, offset = 0 } = req.query;
    const userId = req.userId;

    // Build query
    const query = { user: userId };
    if (status) query.status = status;
    if (type) query.type = type;

    // Get tasks
    let tasks = fileStorage.findTasks(query);
    
    // Sort by creation date (newest first)
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const total = tasks.length;
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    tasks = tasks.slice(startIndex, endIndex);

    res.json({
      status: 'success',
      message: 'Tasks retrieved successfully',
      data: {
        tasks,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: endIndex < total
        }
      }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve tasks'
    });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', [
  auth,
  body('title')
    .notEmpty()
    .withMessage('Title is required'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('type')
    .isIn(['daily', 'weekly', 'monthly', 'special'])
    .withMessage('Invalid task type'),
  body('credits')
    .isInt({ min: 0 })
    .withMessage('Credits must be a non-negative integer'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Invalid difficulty level')
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

    const { title, description, type, credits, difficulty = 'medium' } = req.body;
    const userId = req.userId;

    // Create task
    const task = fileStorage.createTask({
      user: userId,
      title,
      description,
      type,
      credits,
      difficulty,
      status: 'pending',
      progress: 0,
      metadata: {
        createdBy: 'user',
        priority: 1
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Task created successfully',
      data: { task }
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create task'
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', [
  auth,
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100')
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

    const { id } = req.params;
    const { status, progress, notes } = req.body;
    const userId = req.userId;

    // Get task
    const tasks = fileStorage.findTasks({ user: userId });
    const task = tasks.find(t => t._id === id);
    
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Update task
    const updateData = {};
    if (status) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (notes) updateData.notes = notes;

    const updatedTask = fileStorage.updateTask(id, updateData);

    // If task is completed, award credits and create transaction
    if (status === 'completed' && task.status !== 'completed') {
      const user = fileStorage.findUser({ _id: userId });
      if (user) {
        const newCredits = user.credits + task.credits;
        fileStorage.updateUser(userId, { credits: newCredits });

        // Create transaction
        fileStorage.createTransaction({
          user: userId,
          type: 'task_completion',
          category: 'earning',
          amount: task.credits,
          description: `Completed task: ${task.title}`,
          metadata: {
            taskId: task._id,
            taskTitle: task.title,
            taskType: task.type
          },
          status: 'completed'
        });

        // Update user stats
        const newStats = {
          ...user.stats,
          tasksCompleted: (user.stats?.tasksCompleted || 0) + 1
        };
        fileStorage.updateUser(userId, { stats: newStats });
      }
    }

    res.json({
      status: 'success',
      message: 'Task updated successfully',
      data: { task: updatedTask }
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update task'
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Get task
    const tasks = fileStorage.findTasks({ user: userId });
    const task = tasks.find(t => t._id === id);
    
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Delete task (mark as cancelled)
    fileStorage.updateTask(id, { status: 'cancelled' });

    res.json({
      status: 'success',
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete task'
    });
  }
});

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const tasks = fileStorage.findTasks({ user: userId });

    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      totalCreditsEarned: tasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.credits || 0), 0),
      averageProgress: tasks.length > 0 ? 
        tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length : 0
    };

    res.json({
      status: 'success',
      message: 'Task statistics retrieved successfully',
      data: { stats }
    });

  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve task statistics'
    });
  }
});

module.exports = router;