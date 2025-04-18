const express = require('express');
console.log("api/index.js is being executed!"); // Very early log
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const setSecurityHeaders = require('./middleware/security');

const app = express();

// Configure CORS with specific options
// CORS configuration to allow all origins (for development/small scale)
const corsOptions = {
  origin: '*', // Allow all origins
  // Note: credentials:true is removed because it cannot be used with origin: '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(setSecurityHeaders); // Move before cors
app.use(cors(corsOptions));
app.use(express.json());


// Pre-flight requests
app.options('*', cors(corsOptions));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/courses', require('./routes/courses'));
app.use('/user', require('./routes/user'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Internal server error'
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB and start server if not in Vercel
if (process.env.NODE_ENV !== 'production') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

// For Vercel serverless functions
module.exports = app;