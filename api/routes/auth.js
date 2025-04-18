const express = require('express');
const router = express.Router();
// const jwt = require('jsonwebtoken'); // Removed
// const User = require('../models/User'); // Removed

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || 'student'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login route
router.options('/login', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send();
});

router.post('/login', async (req, res) => {
  try {
    // const { email, password } = req.body; // Removed

    // Find user
    // const user = await User.findOne({ email }); // Removed
    // if (!user) { // Removed
    //   return res.status(400).json({ message: 'Invalid credentials' }); // Removed
    // } // Removed

    // Check password
    // const isMatch = await user.comparePassword(password); // Removed
    // if (!isMatch) { // Removed
    //   return res.status(400).json({ message: 'Invalid credentials' }); // Removed
    // } // Removed

    // Generate JWT token
    // const token = jwt.sign( // Removed
    //   { userId: user._id }, // Removed
    //   process.env.JWT_SECRET, // Removed
    //   { expiresIn: '24h' } // Removed
    // ); // Removed
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Add Cache-Control header
    res.status(200).json({ message: 'Test' }); // Simplified response
  } catch (error) {
    console.error("Login error:", error); // Log the entire error object
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 