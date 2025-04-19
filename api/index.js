// /api/index.js
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from './utils/user.js';
import dbConnect from './utils/dbconnect.js';

process.on('uncaughtException', (error) => {
  console.error('CRITICAL ERROR:', error);
});

const app = express();

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
  console.log(`[Debug] ${req.method} ${req.url}`);
  console.log(`[Debug] MONGODB_URI set:`, !!process.env.MONGODB_URI);
  console.log(`[Debug] JWT_SECRET set:`, !!process.env.JWT_SECRET);

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
    console.error(`[Timeout] Request to ${req.url} timed out after 8s`);
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
    console.log(`[DB] Connecting to database for ${req.url}...`);
    await dbConnect();
    console.log(`[DB] Connected successfully for ${req.url}`);
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
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
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
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
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
const verifyToken = wrap(async (req, res, next) => {
  try {
    // Log the full authorization header for debugging
    console.log('[Auth] Authorization header:', req.headers.authorization || 'none');
    
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    console.log('[Auth] Token found, verifying...');
    console.log('[Auth] JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[Auth] Token verified, userId:', decoded.userId);
      
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        console.log('[Auth] User not found for id:', decoded.userId);
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log('[Auth] User found:', user.email);
      req.user = user;
      next();
    } catch (jwtError) {
      console.error('[Auth] JWT verification failed:', jwtError.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('[Auth] Unexpected error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User profile route
app.get('/api/user/profile', wrap(async (req, res) => {
  try {
    console.log('[Profile] Received profile request');
    
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('[Profile] No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }
    
    console.log('[Profile] Verifying token');
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
      console.log('[Profile] Token verified, userId:', userId);
    } catch (jwtError) {
      console.error('[Profile] JWT verification failed:', jwtError.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    console.log('[Profile] Finding user with id:', userId);
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.log('[Profile] User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('[Profile] User found, returning profile');
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
app.get('/api/courses', wrap(async (req, res) => {
  try {
    console.log('[Courses] Fetching all courses');
    // For now, return a mock response
    // In a real app, you would fetch from your database
    res.status(200).json({
      courses: [
        {
          id: '1',
          title: 'Introduction to Web Development',
          description: 'Learn the basics of HTML, CSS, and JavaScript',
          instructor: 'John Doe',
          thumbnail: 'https://via.placeholder.com/300x200',
          duration: '8 weeks',
          level: 'Beginner'
        },
        {
          id: '2',
          title: 'Advanced React',
          description: 'Master React hooks, context, and advanced patterns',
          instructor: 'Jane Smith',
          thumbnail: 'https://via.placeholder.com/300x200',
          duration: '10 weeks',
          level: 'Intermediate'
        },
        {
          id: '3',
          title: 'Full Stack Development with MERN',
          description: 'Build complete applications with MongoDB, Express, React, and Node.js',
          instructor: 'Alex Johnson',
          thumbnail: 'https://via.placeholder.com/300x200',
          duration: '12 weeks',
          level: 'Advanced'
        }
      ]
    });
  } catch (error) {
    console.error('[Courses] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}));

// Course by ID route
app.get('/api/courses/:id', wrap(async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log(`[Courses] Fetching course with ID: ${courseId}`);
    
    // Mock course data
    const courses = {
      '1': {
        id: '1',
        title: 'Introduction to Web Development',
        description: 'Learn the basics of HTML, CSS, and JavaScript',
        instructor: 'John Doe',
        thumbnail: 'https://via.placeholder.com/300x200',
        duration: '8 weeks',
        level: 'Beginner',
        lessons: [
          { id: '1-1', title: 'HTML Basics', completed: false },
          { id: '1-2', title: 'CSS Styling', completed: false },
          { id: '1-3', title: 'JavaScript Fundamentals', completed: false }
        ]
      },
      '2': {
        id: '2',
        title: 'Advanced React',
        description: 'Master React hooks, context, and advanced patterns',
        instructor: 'Jane Smith',
        thumbnail: 'https://via.placeholder.com/300x200',
        duration: '10 weeks',
        level: 'Intermediate',
        lessons: [
          { id: '2-1', title: 'React Hooks', completed: false },
          { id: '2-2', title: 'Context API', completed: false },
          { id: '2-3', title: 'Performance Optimization', completed: false }
        ]
      },
      '3': {
        id: '3',
        title: 'Full Stack Development with MERN',
        description: 'Build complete applications with MongoDB, Express, React, and Node.js',
        instructor: 'Alex Johnson',
        thumbnail: 'https://via.placeholder.com/300x200',
        duration: '12 weeks',
        level: 'Advanced',
        lessons: [
          { id: '3-1', title: 'MongoDB Basics', completed: false },
          { id: '3-2', title: 'Express API Development', completed: false },
          { id: '3-3', title: 'Full Stack Integration', completed: false }
        ]
      }
    };
    
    const course = courses[courseId];
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.status(200).json({ course });
  } catch (error) {
    console.error(`[Courses] Error fetching course:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}));

// Add more routes here as needed...

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Export handler for Vercel
export default function handler(req, res) {
  return app(req, res);
}