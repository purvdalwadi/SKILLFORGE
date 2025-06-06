// /api/index.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANT: Load environment variables at the very beginning of the script.
// This ensures that all subsequent modules and configurations have access to them.
// Load environment variables once from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // This MUST be as early as possible


import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from './utils/user.js';
import Course from './utils/course.js';
import Feedback from './utils/feedback.js'; // Import Feedback model
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import mongoose from 'mongoose'; // Added for ObjectId

// Import database connection last
import dbConnect from './utils/dbconnect.js';

process.on('uncaughtException', (error) => {
  console.error('CRITICAL ERROR:', error);
});

const app = express();
app.use(passport.initialize());

// Vercel CORS middleware: always set CORS headers and handle OPTIONS preflight
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// CORS
app.use(cors({ origin: true, credentials: true }));
app.options('*', cors({ origin: true, credentials: true }));
app.use(express.json());

// Debug middleware to trace requests and validate env
app.use((req, res, next) => {


  // Health check endpoint - MUST be before DB connection
  if (req.url === '/api/health') {
    return res.status(200).json({ 
      status: 'up',
      env: {
        mongodb: !!process.env.MONGODB_URI,
        jwt: !!process.env.JWT_SECRET
      }
    });
  }

  next();
});

// Health check moved to middleware above

// Timeout middleware to prevent hanging indefinitely
app.use((req, res, next) => {
  // Set a 8-second timeout for all requests
  const timeout = setTimeout(() => {
    console.error('Request processing timeout');
    if (!res.headersSent) {
      res.status(503).json({ 
        error: 'Service unavailable', 
        message: 'Request timed out while processing' 
      });
    }
  }, 8000);

  // Clear the timeout when the response is sent
  res.on('finish', () => clearTimeout(timeout));
  next();
});

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await dbConnect();
    next();
  } catch (error) {
    console.error(`[DB] Connection failed for ${req.url}:`, error.message);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ 
      error: 'Database connection failed', 
      message: error.message 
    });
  }
});

// Routes with error wrapping
const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.error('ROUTE CRASH:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'Server exploded' });
  }
};

// Signup/register handler function
const signupHandler = wrap(async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role: role || 'student' });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h', algorithm: 'HS256' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register both routes with the same handler
app.post('/api/auth/signup', signupHandler);
app.post('/api/auth/register', signupHandler);

// Login route
app.post('/api/auth/login', wrap(async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h', algorithm: 'HS256' });
    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}));

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// User profile route
app.get('/api/user/profile', wrap(async (req, res) => {
  try {
    //console.log('[Profile] Received profile request');
    
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      //console.log('[Profile] No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }
    
    //console.log('[Profile] Verifying token');
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      userId = decoded.userId;
      //console.log('[Profile] Token verified, userId:', userId);
    } catch (jwtError) {
      console.error('[Profile] JWT verification failed:', jwtError.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    //console.log('[Profile] Finding user with id:', userId);
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      //console.log('[Profile] User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    
    //console.log('[Profile] User found, returning profile');
    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Profile] Unexpected error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}));

// Courses routes
app.get(['/api/courses', '/courses'], wrap(async (req, res) => {
  //console.log('[Courses] Fetching all courses from DB');
  try {
    // Ensure we're connected to the database
    await dbConnect();
    //console.log('[Courses] DB connected, querying courses');
    const coursesList = await Course.find({}).populate('instructor', 'name email role');
    //console.log(`[Courses] Found ${coursesList.length} courses`);
    res.status(200).json({ courses: coursesList });
  } catch (error) {
    console.error('[Courses] Error fetching from DB:', error.message);
    res.status(500).json({ message: 'Failed to fetch courses from database', error: error.message });
  }
}));

// Create a new course (production-ready)
app.post(['/api/courses', '/courses'], wrap(async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (jwtError) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    // Validate required fields
    const { title, description, category, level, thumbnail, lessons } = req.body;
    if (!title || !description || !category || !level) {
      return res.status(400).json({ message: 'Missing required course fields' });
    }
    // Create course
    const course = new Course({
      title,
      description,
      category,
      level,
      thumbnail,
      lessons: Array.isArray(lessons) ? lessons : [],
      instructor: decoded.userId
    });
    await course.save();
    await course.populate('instructor', 'name email role');
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    console.error('[CourseCreate] Error creating course:', error.message);
    res.status(500).json({ message: 'Failed to create course', error: error.message });
  }
}));

// Fetch enrolled courses (must be before /:id route)
app.get(['/api/courses/enrolled', '/courses/enrolled'], wrap(async (req, res) => {
  //console.log('[Enrolled] Fetching enrolled courses');
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    //console.log('[Enrolled] Token verified, userId:', decoded.userId);
    
    // Ensure DB connection
    await dbConnect();
    //console.log('[Enrolled] DB connected, finding user');
    
    // Retrieve user's enrolled courses with full course details
    const userDoc = await User.findById(decoded.userId)
      .select('enrolledCourses')
      .populate({
        path: 'enrolledCourses.courseId',
        model: 'Course',
        populate: { path: 'instructor', select: 'name email role' }
      });
      
    if (!userDoc) {
      //console.log('[Enrolled] User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    
    //console.log(`[Enrolled] Found ${userDoc.enrolledCourses?.length || 0} enrolled courses`);
    res.status(200).json(userDoc.enrolledCourses || []);
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      console.error('[Enrolled] Token verification failed:', error.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    console.error('[Enrolled] Error fetching enrolled courses:', error.message);
    res.status(500).json({ message: 'Failed to fetch enrolled courses', error: error.message });
  }
}));

// Fetch instructor courses with enrollment data
app.get(['/api/courses/instructor', '/courses/instructor'], wrap(async (req, res) => {
  //console.log('[Instructor] Fetching instructor courses with enrollment data');
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    //console.log('[Instructor] Token verified, userId:', decoded.userId);
    
    // Ensure DB connection
    await dbConnect();
    //console.log('[Instructor] DB connected, finding courses');
    
    // Retrieve courses taught by this instructor
    const courses = await Course.find({ instructor: decoded.userId })
      .populate('instructor', 'name email role');
      
    // Get enrollment data for each course
    const courseIds = courses.map(course => course._id);
    //console.log(`[Instructor] Found ${courses.length} instructor courses, getting enrollment data`);
    
    // Find all users who have enrolled in any of these courses
    const enrollmentData = await User.aggregate([
      { $match: { 'enrolledCourses.courseId': { $in: courseIds } } },
      { $unwind: '$enrolledCourses' },
      { $match: { 'enrolledCourses.courseId': { $in: courseIds } } },
      { $group: {
        _id: '$enrolledCourses.courseId',
        enrolledCount: { $sum: 1 },
        students: { $push: { id: '$_id', name: '$name', email: '$email' } }
      }}
    ]);
    
    //console.log(`[Instructor] Found enrollment data:`, enrollmentData);
    
    // Attach enrollment data to each course
    const coursesWithEnrollment = courses.map(course => {
      const courseData = course.toObject();
      const enrollment = enrollmentData.find(e => e._id.toString() === course._id.toString());
      
      courseData.enrollmentStats = {
        count: enrollment ? enrollment.enrolledCount : 0,
        students: enrollment ? enrollment.students : []
      };
      
      return courseData;
    });
    
    //console.log(`[Instructor] Returning ${coursesWithEnrollment.length} courses with enrollment data`);
    res.status(200).json(coursesWithEnrollment);
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      console.error('[Instructor] Token verification failed:', error.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    console.error('[Instructor] Error fetching instructor courses:', error.message);
    res.status(500).json({ message: 'Failed to fetch instructor courses', error: error.message });
  }
}));

// Course by ID route
app.get(['/api/courses/:id', '/courses/:id'], wrap(async (req, res) => {
  const { id } = req.params;
  //console.log('[Courses] Fetching course ID:', id);
  try {
    // Ensure we're connected to the database
    await dbConnect();
    //console.log('[Courses] DB connected, querying course:', id);
    const course = await Course.findById(id).populate('instructor', 'name email role');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    //console.log('[Courses] Found course:', course.title);
    res.status(200).json({ course });
  } catch (error) {
    console.error('[Courses] Error fetching course:', error.message);
    res.status(500).json({ message: 'Failed to fetch course from database', error: error.message });
  }
}));

// Course enrollment endpoint
app.post(['/api/courses/:id/enroll', '/courses/:id/enroll'], wrap(async (req, res) => {
  const { id } = req.params;
  //console.log(`[Enroll] Processing enrollment for course: ${id}`);
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    //console.log('[Enroll] No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    //console.log('[Enroll] Token verified, userId:', decoded.userId);
    
    // Ensure DB connection
    await dbConnect();
    //console.log('[Enroll] DB connected, finding course and user');
    
    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      //console.log('[Enroll] Course not found');
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Find the user
    const user = await User.findById(decoded.userId);
    if (!user) {
      //console.log('[Enroll] User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if already enrolled
    const alreadyEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.courseId.toString() === id
    );
    
    if (alreadyEnrolled) {
      //console.log('[Enroll] User already enrolled in this course');
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    // Add course to user's enrolledCourses
    user.enrolledCourses.push({
      courseId: course._id,
      progress: 0,
      completed: false
    });
    
    // Also add user to course's enrolledStudents
    if (!course.enrolledStudents.includes(user._id)) {
      course.enrolledStudents.push(user._id);
      await course.save();
    }
    
    await user.save();
    //console.log('[Enroll] Enrollment successful');
    
    res.status(200).json({ 
      success: true,
      message: 'Successfully enrolled in course',
      courseId: course._id,
      title: course.title
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      console.error('[Enroll] Token verification failed:', error.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    console.error('[Enroll] Error processing enrollment:', error.message);
    res.status(500).json({ message: 'Failed to enroll in course', error: error.message });
  }
}));

// Course update endpoint for instructors
app.put(['/api/courses/:id', '/courses/:id'], wrap(async (req, res) => {
  const { id } = req.params;
  //console.log(`[CourseUpdate] Updating course: ${id}`);
  
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    //console.log('[CourseUpdate] No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    //console.log('[CourseUpdate] Token verified, userId:', decoded.userId);
    
    // Ensure DB connection
    await dbConnect();
    //console.log('[CourseUpdate] DB connected, finding course');
    
    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      //console.log('[CourseUpdate] Course not found');
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Verify the user is the instructor of this course
    if (course.instructor.toString() !== decoded.userId) {
      //console.log('[CourseUpdate] User is not the instructor of this course');
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }
    
    // Update course fields
    const updatableFields = [
      'title', 'description', 'category', 'level',
      'duration', 'price', 'thumbnail', 'lessons'
    ];
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });
    
    await course.save();
    //console.log('[CourseUpdate] Course updated successfully');
    
    res.status(200).json({ 
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      console.error('[CourseUpdate] Token verification failed:', error.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    console.error('[CourseUpdate] Error updating course:', error.message);
    res.status(500).json({ message: 'Failed to update course', error: error.message });
  }
}));

// Course progress update endpoint (Overall course progress)
app.put(['/api/courses/:id/progress', '/courses/:id/progress'], verifyToken, wrap(async (req, res) => {
  const { id } = req.params;
  const { progress } = req.body;
  
  if (progress === undefined || progress < 0 || progress > 100) {
    return res.status(400).json({ message: 'Invalid progress value (0-100)' });
  }
  
  try {
    await dbConnect();
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const enrollmentIndex = user.enrolledCourses.findIndex(
      enrollment => enrollment.courseId.toString() === id
    );
    
    if (enrollmentIndex === -1) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }
    
    user.enrolledCourses[enrollmentIndex].progress = progress;
    user.enrolledCourses[enrollmentIndex].completed = progress === 100;
    
    await user.save();
    
    res.status(200).json({ 
      success: true,
      message: 'Progress updated successfully',
      progress,
      completed: progress === 100
    });
  } catch (error) {
    console.error('Error updating course progress:', error);
    res.status(500).json({ message: 'Failed to update progress', error: error.message });
  }
}));

// Lesson progress update endpoint
app.post(['/api/courses/:courseId/lessons/:lessonId/progress', '/courses/:courseId/lessons/:lessonId/progress'], 
  verifyToken,
  wrap(async (req, res) => {
    const { courseId, lessonId } = req.params;
    let lastWatchedSecond;
    
    try {
      // Handle both JSON object and raw number in request body
      if (typeof req.body === 'object' && 'lastWatchedSecond' in req.body) {
        lastWatchedSecond = parseFloat(req.body.lastWatchedSecond);
      } else if (typeof req.body === 'object') {
        const firstValue = Object.values(req.body)[0];
        lastWatchedSecond = parseFloat(firstValue);
      } else {
        lastWatchedSecond = parseFloat(req.body);
      }

      if (isNaN(lastWatchedSecond) || lastWatchedSecond < 0) {
        return res.status(400).json({ 
          message: 'Valid lastWatchedSecond is required' 
        });
      }

      await dbConnect();

      const [user, course] = await Promise.all([
        User.findById(req.user.userId),
        Course.findById(courseId)
      ]);

      if (!user) return res.status(404).json({ message: 'User not found' });
      if (!course) return res.status(404).json({ message: 'Course not found' });

      const enrollment = user.enrolledCourses.find(
        e => e.courseId.toString() === courseId
      );

      if (!enrollment) {
        return res.status(404).json({ message: 'Not enrolled in this course' });
      }

      const lesson = course.lessons.id(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }

      // Calculate progress percentage
      // Ensure consistent progress calculation
      const lessonDurationSeconds = (lesson.duration || 0) * 60;
      const progressPercentage = lessonDurationSeconds > 0 
        ? Math.min(100, Math.round((lastWatchedSecond / lessonDurationSeconds) * 100))
        : Math.min(100, Math.round((lastWatchedSecond / 60) * 10)); // Fallback calculation
      
      console.log(`[Progress] Lesson duration: ${lessonDurationSeconds}s, Watched: ${lastWatchedSecond}s, Progress: ${progressPercentage}%`);
      const isCompleted = progressPercentage >= 90;

      // Update lesson progress
      const lessonProgressIndex = enrollment.lessonProgress.findIndex(
        lp => lp.lessonId.toString() === lessonId
      );

      // Handle lessonId conversion safely
      const lessonObjectId = mongoose.Types.ObjectId.isValid(lessonId) 
        ? (lessonId instanceof mongoose.Types.ObjectId ? lessonId : new mongoose.Types.ObjectId(lessonId))
        : null;
        
      if (!lessonObjectId) {
        console.error('[Progress] Invalid lessonId format:', lessonId);
        return res.status(400).json({ message: 'Invalid lesson ID format' });
      }

      const updatedProgress = {
        lessonId: lessonObjectId,
        lastWatchedSecond,
        progress: progressPercentage,
        completed: isCompleted,
        updatedAt: new Date()
      };

      if (lessonProgressIndex === -1) {
        enrollment.lessonProgress.push(updatedProgress);
      } else {
        enrollment.lessonProgress[lessonProgressIndex] = {
          ...enrollment.lessonProgress[lessonProgressIndex],
          ...updatedProgress
        };
      }

      // Update completedLessons array
      const completedLessonIndex = enrollment.completedLessons
        .findIndex(id => id.toString() === lessonId);
      
      if (isCompleted && completedLessonIndex === -1) {
        enrollment.completedLessons.push(lessonId);
      } else if (!isCompleted && completedLessonIndex !== -1) {
        enrollment.completedLessons.splice(completedLessonIndex, 1);
      }

      // Calculate overall course progress
      const totalLessons = course.lessons.length;
      enrollment.progress = totalLessons > 0
        ? Math.round((enrollment.completedLessons.length / totalLessons) * 100)
        : 0;
      
      enrollment.completed = enrollment.progress === 100;

      try {
        console.log('[Progress] Saving user progress to database...');
        await user.save();
        console.log('[Progress] User progress saved successfully');

        res.status(200).json({
          success: true,
          message: 'Progress updated successfully',
          lessonProgress: progressPercentage,
          courseProgress: enrollment.progress,
          completed: isCompleted,
          lastWatchedSecond,
          debug: {
            lessonProgressLength: enrollment.lessonProgress.length,
            completedLessonsLength: enrollment.completedLessons.length,
            overallProgress: enrollment.progress
          }
        });
      } catch (saveError) {
        console.error('[Progress] Error saving user progress:', saveError);
        throw saveError;
      }

    } catch (error) {
      console.error('Error updating lesson progress:', error);
      res.status(500).json({ 
        message: 'Failed to update progress',
        error: error.message 
      });
    }
}));

// Get lesson progress endpoint
app.get(['/api/courses/:courseId/lessons/:lessonId/progress', '/courses/:courseId/lessons/:lessonId/progress'],
  verifyToken,
  wrap(async (req, res) => {
    const { courseId, lessonId } = req.params;
    
    try {
      await dbConnect();

      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const enrollment = user.enrolledCourses.find(
        e => e.courseId.toString() === courseId
      );

      if (!enrollment) {
        return res.status(404).json({ message: 'Not enrolled in this course' });
      }

      const lessonProgress = enrollment.lessonProgress.find(
        lp => lp.lessonId.toString() === lessonId
      );

      res.status(200).json(lessonProgress || {
        lessonId,
        lastWatchedSecond: 0,
        progress: 0,
        completed: false
      });

    } catch (error) {
      console.error('Error fetching lesson progress:', error);
      res.status(500).json({ 
        message: 'Failed to fetch progress',
        error: error.message 
      });
    }
}));

// YouTube metadata fetching endpoint
app.get(['/api/youtube-metadata', '/youtube-metadata'], wrap(async (req, res) => {
  const { url } = req.query;
  //console.log(`[YouTube] Fetching metadata for URL: ${url}`);
  
  if (!url) {
    return res.status(400).json({ message: 'URL parameter is required' });
  }
  
  try {
    // Extract video ID from YouTube URL
    let videoId;
    const urlObj = new URL(url);
    
    if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v');
    } else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.substring(1);
    }
    
    if (!videoId) {
      return res.status(400).json({ message: 'Invalid YouTube URL' });
    }
    
    //console.log(`[YouTube] Extracted video ID: ${videoId}`);
    
    // Use YouTube Data API to get accurate video metadata
    const YOUTUBE_API_KEY = 'AIzaSyAqBfyR0oQChZQl0xmZCkvv4f-Ij9Z3KZ4';
    const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${YOUTUBE_API_KEY}`;
    
    //console.log(`[YouTube] Fetching data from YouTube Data API for video ID: ${videoId}`);
    
    const youtubeResponse = await fetch(youtubeApiUrl);
    const youtubeData = await youtubeResponse.json();
    
    if (!youtubeData.items || youtubeData.items.length === 0) {
      //console.log('[YouTube] No items found in YouTube API response');
      return res.status(404).json({ message: 'Video not found' });
    }
    
    const videoDetails = youtubeData.items[0];
    const snippet = videoDetails.snippet;
    const contentDetails = videoDetails.contentDetails;
    
    // Parse ISO 8601 duration format (PT1H2M3S)
    function parseIsoDuration(isoDuration) {
      const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseInt(match[3] || 0);
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    const durationInSeconds = parseIsoDuration(contentDetails.duration);
    //console.log(`[YouTube] Parsed duration: ${durationInSeconds} seconds from ${contentDetails.duration}`);
    
    // Get highest resolution thumbnail available
    const thumbnails = snippet.thumbnails;
    const thumbnailUrl = 
      (thumbnails.maxres && thumbnails.maxres.url) ||
      (thumbnails.high && thumbnails.high.url) ||
      (thumbnails.medium && thumbnails.medium.url) ||
      (thumbnails.default && thumbnails.default.url);
    
    // Extract and format relevant data
    const metadata = {
      title: snippet.title,
      description: snippet.description,
      duration: durationInSeconds,
      thumbnail: thumbnailUrl,
      author: snippet.channelTitle,
      videoId,
      url: url // Keep the URL so it doesn't disappear
    };
    
    //console.log(`[YouTube] Successfully fetched metadata for video: ${snippet.title}`);
    
    res.status(200).json(metadata);
  } catch (error) {
    console.error('[YouTube] Error fetching metadata:', error.message);
    res.status(500).json({ message: 'Failed to fetch video metadata', error: error.message });
  }
}));

// Stats summary endpoint
app.get('/api/stats/summary', wrap(async (req, res) => {
  //console.log('[Stats] Fetching summary counts');
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalInstructors = await User.countDocuments({ role: 'instructor' });
  const totalCourses = await Course.countDocuments();
  res.status(200).json({ totalStudents, totalCourses, totalInstructors });
}));

// Feedback submission endpoint
app.post('/api/feedback', wrap(async (req, res) => {
  //console.log('[Feedback] Received feedback post:', req.body);
  const { email, message } = req.body;
  if (!email || !message) return res.status(400).json({ message: 'Email and message required' });
  const feedbackDoc = new Feedback({ email, message });
  await feedbackDoc.save();
  res.status(201).json({ message: 'Feedback saved' });
}));

// Google OAuth strategy
// Determine URLs based on environment
const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || (isProduction ? 'https://skillforge-teal.vercel.app' : 'http://localhost:5173');
const BACKEND_URL = process.env.BACKEND_URL || (isProduction ? 'https://skillforge-teal.vercel.app/' : `http://localhost:${process.env.PORT || 5174}`);
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${BACKEND_URL}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await User.findOne({ email });
    if (!user) {
      // Generate a hashed password from profile ID for OAuth users
      const hashedPassword = await bcrypt.hash(profile.id, 10);
      user = new User({ name: profile.displayName, email, password: hashedPassword, role: 'student' });
      await user.save();
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

// OAuth routes
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get(
  '/api/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=oauth` }),
  (req, res) => {
    // Issue JWT
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
    // Determine frontend redirect based on role
    const redirectPath = req.user.role === 'instructor' ? '/instructor-dashboard' : '/dashboard';
    // Redirect to OAuth success handler with token and path
    res.redirect(
      `${FRONTEND_URL}/oauth-success?token=${token}&redirectPath=${encodeURIComponent(redirectPath)}`
    );
  }
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Export handler for Vercel
export default function handler(req, res) {
  return app(req, res);
}

// Start the server if running directly (not in Vercel)
// Always start the server when running the file directly
const PORT = process.env.PORT || 5174;
app.listen(PORT, () => {
  console.log(`[Server] API server running on http://localhost:${PORT}`);
});

// This is still needed for Vercel serverless deployment
