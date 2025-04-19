// /api/index.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./utils/user'); // Use lowercase 'user' for consistency
const dbConnect = require('./utils/dbconnect');

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

// Explicitly handle preflight OPTIONS requests for all routes
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).end();
});

// Connect to MongoDB before handling any requests
app.use(async (req, res, next) => {
  await dbConnect();
  next();
});

// Signup route
app.post('/api/auth/signup', async (req, res) => {
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

// Login route
app.post('/api/auth/login', async (req, res) => {
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
});

// Add more routes here as needed...

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Export for Vercel serverless
module.exports = (req, res) => {
  app(req, res);
};