// /api/utils/User.js
const mongoose = require('mongoose');

// Avoid model overwrite upon hot-reload in dev
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
    // In production, store hashed passwords!
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);