const mongoose = require('mongoose');
const app = require('./index.js');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB in Vercel environment'))
  .catch(err => console.error('MongoDB connection error in Vercel:', err));

// Export the Express API
module.exports = app;