// /api/utils/User.js
import mongoose from 'mongoose';

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
    enum: ['student', 'admin', 'instructor'],
    default: 'student'
  },
  profile: { type: String, default: '' },
  enrolledCourses: [
    {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      progress: { type: Number, default: 0 }, // Overall course progress
      completed: { type: Boolean, default: false },
      // {{Add lessonProgress array here}}
      lessonProgress: [{
          _id: false, // Don't create separate _id for sub-sub-documents unless needed
          lessonId: { type: mongoose.Schema.Types.ObjectId }, // Reference to the specific lesson _id
          lastWatchedSecond: { type: Number, default: 0 } // Timestamp where user left off
      }]
    }
  ],
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);