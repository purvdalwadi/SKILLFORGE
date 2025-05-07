import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  email: { type: String, required: true },
  message: { type: String, required: true }
});

export default mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);
