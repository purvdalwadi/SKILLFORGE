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
      completedLessons: [{ type: mongoose.Schema.Types.ObjectId }], // Array of completed lesson IDs
      lessonProgress: [{
        lessonId: { type: mongoose.Schema.Types.ObjectId },
        lastWatchedSecond: { type: Number, default: 0 },
        progress: { type: Number, default: 0 }, // Progress percentage for this lesson
        completed: { type: Boolean, default: false }
      }]
    }
  ],
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);