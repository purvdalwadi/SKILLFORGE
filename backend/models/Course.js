const mongoose = require('mongoose');

// YouTube URL validation helper
const validateYouTubeUrl = (url) => {
  if (!url) return true; // Allow empty URLs
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}$/;
  return youtubeRegex.test(url);
};

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    validate: {
      validator: validateYouTubeUrl,
      message: 'Invalid YouTube URL format'
    }
  },
  duration: {
    type: Number,
    required: true,
    min: 0
  },
  content: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  thumbnail: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  duration: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lessons: [lessonSchema],
  enrolledStudents: {
    type: Number,
    default: 0,
    min: 0
  },
  averageProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for better query performance
courseSchema.index({ category: 1, isPublished: 1 });
courseSchema.index({ instructor: 1, isPublished: 1 });

// Add virtual for calculating total duration
courseSchema.virtual('totalDuration').get(function() {
  return this.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;