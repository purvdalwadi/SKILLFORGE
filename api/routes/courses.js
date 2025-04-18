const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const instructor = require('../middleware/instructor');
const User = require('../models/User');
const Course = require('../models/Course');

// Get courses created by the logged-in instructor
// This route needs to come before /:courseId to avoid conflict
router.get('/instructor', auth, instructor, async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate('instructor', 'name email profile')
      .select('title description category level duration price thumbnail instructor enrolledStudents')
      .lean();

    if (!courses) {
      return res.status(404).json({ message: 'No courses found' });
    }

    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ 
      message: 'Error fetching courses', 
      error: error.message || 'Internal server error'
    });
  }
});

// Get course details
router.get('/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate('instructor', 'name email profile');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new course (instructor only)
router.post('/', auth, instructor, async (req, res) => {
  try {
    const newCourse = new Course({
      ...req.body,
      instructor: req.user._id
    });
    
    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a course (instructor only)
router.put('/:courseId', auth, instructor, async (req, res) => {
  try {
    // Ensure the instructor owns this course
    const course = await Course.findOne({
      _id: req.params.courseId,
      instructor: req.user._id
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not have permission to update it' });
    }
    
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.courseId,
      { $set: req.body },
      { new: true }
    );
    
    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a course (instructor only)
router.delete('/:courseId', auth, instructor, async (req, res) => {
  try {
    // Ensure the instructor owns this course
    const course = await Course.findOne({
      _id: req.params.courseId,
      instructor: req.user._id
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not have permission to delete it' });
    }
    
    await Course.findByIdAndDelete(req.params.courseId);
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Enroll in a course
router.post('/:courseId/enroll', auth, async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    console.log('Starting enrollment process...');
    console.log('Course ID:', courseId);
    console.log('User ID:', req.user._id);

    // Validate courseId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      const error = new Error('Invalid course ID format');
      error.status = 400;
      throw error;
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      const error = new Error('Course not found');
      error.status = 404;
      throw error;
    }
    console.log('Course found:', course.title);

    // Check if already enrolled using proper ObjectId comparison
    const existingEnrollment = await User.findOne({
      _id: req.user._id,
      'enrolledCourses.courseId': mongoose.Types.ObjectId(courseId)
    });

    if (existingEnrollment) {
      const error = new Error('Already enrolled in this course');
      error.status = 400;
      throw error;
    }

    // Create enrollment object
    const enrollmentData = {
      courseId: mongoose.Types.ObjectId(courseId),
      progress: 0,
      completed: false,
      enrolledAt: new Date()
    };

    // Add course to enrolled courses
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { enrolledCourses: enrollmentData }
      },
      { 
        new: true,
        runValidators: true
      }
    ).populate('enrolledCourses.courseId');

    if (!updatedUser) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    // Find the newly added enrollment
    const enrollment = updatedUser.enrolledCourses.find(
      e => e.courseId._id.toString() === courseId
    );

    console.log('Successfully enrolled user in course');
    
    res.json({ 
      message: 'Successfully enrolled in course', 
      success: true,
      enrollment
    });
  } catch (error) {
    console.error('Enrollment error details:', {
      error: error.message,
      stack: error.stack,
      courseId: req.params.courseId,
      userId: req.user?._id
    });
    next(error); // Pass error to error handling middleware
  }
});

// Add a lesson to a course (instructor only)
router.post('/:courseId/lessons', auth, instructor, async (req, res) => {
  try {
    // Check if the instructor owns this course
    const course = await Course.findOne({
      _id: req.params.courseId,
      instructor: req.user._id
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not have permission to modify it' });
    }
    
    // Add the new lesson
    course.lessons.push(req.body);
    await course.save();
    
    res.status(201).json(course.lessons[course.lessons.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a lesson (instructor only)
router.put('/:courseId/lessons/:lessonId', auth, instructor, async (req, res) => {
  try {
    // Check if the instructor owns this course
    const course = await Course.findOne({
      _id: req.params.courseId,
      instructor: req.user._id
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not have permission to modify it' });
    }
    
    // Find the lesson index
    const lessonIndex = course.lessons.findIndex(
      lesson => lesson._id.toString() === req.params.lessonId
    );
    
    if (lessonIndex === -1) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Update the lesson
    course.lessons[lessonIndex] = {
      ...course.lessons[lessonIndex].toObject(),
      ...req.body
    };
    
    await course.save();
    
    res.json(course.lessons[lessonIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a lesson (instructor only)
router.delete('/:courseId/lessons/:lessonId', auth, instructor, async (req, res) => {
  try {
    // Check if the instructor owns this course
    const course = await Course.findOne({
      _id: req.params.courseId,
      instructor: req.user._id
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not have permission to modify it' });
    }
    
    // Filter out the lesson to delete
    course.lessons = course.lessons.filter(
      lesson => lesson._id.toString() !== req.params.lessonId
    );
    
    await course.save();
    
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save/update lesson video progress for a user
router.post('/:courseId/lessons/:lessonId/progress', auth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { lastWatchedSecond } = req.body;
    
    if (typeof lastWatchedSecond !== 'number') {
      return res.status(400).json({ message: 'lastWatchedSecond must be a number' });
    }

    // Find the user and the enrolled course
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const enrolled = user.enrolledCourses.find(ec => 
      ec.courseId.toString() === courseId
    );
    
    if (!enrolled) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }

    // Find or create lesson progress
    let lesson = enrolled.lessonProgress.find(lp => 
      lp.lessonId.toString() === lessonId
    );

    if (lesson) {
      // Update existing progress
      lesson.lastWatchedSecond = lastWatchedSecond;
      lesson.updatedAt = new Date();
    } else {
      // Create new progress entry
      enrolled.lessonProgress.push({
        lessonId,
        lastWatchedSecond,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await user.save();

    // Calculate and update overall course progress
    const course = await Course.findById(courseId);
    if (course && course.lessons) {
      const totalLessons = course.lessons.length;
      const completedLessons = enrolled.lessonProgress.filter(lp => {
        const lesson = course.lessons.find(l => l._id.toString() === lp.lessonId.toString());
        return lesson && (lp.lastWatchedSecond / lesson.duration) >= 0.9;
      }).length;
      
      enrolled.progress = Math.ceil((completedLessons / totalLessons) * 100);
      enrolled.completed = enrolled.progress === 100;
      await user.save();
    }

    res.json({ 
      message: 'Progress saved', 
      lastWatchedSecond,
      progress: enrolled.progress,
      completed: enrolled.completed 
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get lesson video progress for a user
router.get('/:courseId/lessons/:lessonId/progress', auth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const enrolled = user.enrolledCourses.find(ec => 
      ec.courseId.toString() === courseId
    );
    
    if (!enrolled) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }

    const lesson = enrolled.lessonProgress.find(lp => 
      lp.lessonId.toString() === lessonId
    );

    res.json({ 
      lastWatchedSecond: lesson ? lesson.lastWatchedSecond : 0,
      progress: enrolled.progress || 0,
      completed: enrolled.completed || false
    });
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all students enrolled in a course (instructor only)
router.get('/:courseId/students', auth, instructor, async (req, res) => {
  try {
    // Check if the instructor owns this course
    const course = await Course.findOne({
      _id: req.params.courseId,
      instructor: req.user._id
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not have permission to access it' });
    }
    
    // Find all users enrolled in this course
    const students = await User.find({
      'enrolledCourses.courseId': req.params.courseId
    })
    .select('name email profile enrolledCourses.$');
    
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get course statistics (instructor only)
router.get('/:courseId/stats', auth, instructor, async (req, res) => {
  try {
    // Check if the instructor owns this course
    const course = await Course.findOne({
      _id: req.params.courseId,
      instructor: req.user._id
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not have permission to access it' });
    }
    
    // Find all users enrolled in this course
    const students = await User.find({
      'enrolledCourses.courseId': req.params.courseId
    });
    
    // Calculate statistics
    const totalStudents = students.length;
    const completedCount = students.filter(
      student => {
        const enrollment = student.enrolledCourses.find(
          course => course.courseId.toString() === req.params.courseId
        );
        return enrollment && enrollment.completed;
      }
    ).length;
    
    const averageProgress = students.reduce((sum, student) => {
      const enrollment = student.enrolledCourses.find(
        course => course.courseId.toString() === req.params.courseId
      );
      return sum + (enrollment ? enrollment.progress : 0);
    }, 0) / (totalStudents || 1);
    
    res.json({
      totalStudents,
      completedCount,
      completionRate: totalStudents ? (completedCount / totalStudents * 100) : 0,
      averageProgress
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;