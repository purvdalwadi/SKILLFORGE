import mongoose from 'mongoose';

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content:   { type: String },
  duration: { type: Number, default: 0 }, // Consider if duration should be fetched dynamically
  videoUrl: { type: String },
  // 'completed' might be better tracked per-user, not globally on the lesson
  // completed: { type: Boolean, default: false }
}); // Allow Mongoose to add the default _id

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnail: { type: String },
  duration: { type: String }, // Overall course duration (maybe calculated?)
  level: { type: String },
  category: { type: String },
  lessons: [LessonSchema], // Lessons will now have _id
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.models.Course || mongoose.model('Course', CourseSchema);
