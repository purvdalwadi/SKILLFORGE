const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('enrolledCourses.courseId');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, profile } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, profile },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get enrolled courses
router.get('/courses', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'enrolledCourses.courseId',
        select: 'title category level thumbnail lessons instructor duration',
        populate: {
          path: 'instructor',
          select: 'name email profile'
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out any null courseId entries that might exist
    const validCourses = user.enrolledCourses.filter(course => course.courseId != null);

    res.json(validCourses);
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ 
      message: 'Error fetching enrolled courses', 
      error: error.message 
    });
  }
});

// Update course progress
router.put('/courses/:courseId/progress', auth, async (req, res) => {
  try {
    const { progress } = req.body;
    
    // Validate progress value
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({ 
        message: 'Invalid progress value. Progress must be a number between 0 and 100.' 
      });
    }

    // Find user and update the specific course progress
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        'enrolledCourses.courseId': req.params.courseId
      },
      {
        $set: {
          'enrolledCourses.$.progress': progress,
          'enrolledCourses.$.completed': progress === 100,
          'enrolledCourses.$.lastUpdated': new Date()
        }
      },
      { new: true }
    ).populate('enrolledCourses.courseId');

    if (!updatedUser) {
      return res.status(404).json({ 
        message: 'Course enrollment not found' 
      });
    }

    // Find the updated course in the user's enrolled courses
    const updatedCourse = updatedUser.enrolledCourses.find(
      course => course.courseId._id.toString() === req.params.courseId
    );

    res.json({
      success: true,
      progress: updatedCourse.progress,
      completed: updatedCourse.completed,
      lastUpdated: updatedCourse.lastUpdated
    });

  } catch (error) {
    console.error('Error updating course progress:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating course progress',
      error: error.message 
    });
  }
});

module.exports = router;