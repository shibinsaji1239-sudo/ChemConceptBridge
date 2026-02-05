const mongoose = require('mongoose');

const revisionScheduleSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  concept: { type: mongoose.Schema.Types.ObjectId, ref: 'Concept', required: true },
  
  // Spaced Repetition Parameters (SM-2 Algorithm)
  interval: { type: Number, default: 1 }, // in days
  repetitionCount: { type: Number, default: 0 },
  easeFactor: { type: Number, default: 2.5 },
  
  lastReviewed: { type: Date, default: Date.now },
  nextReview: { type: Date, required: true },
  
  status: { 
    type: String, 
    enum: ['active', 'mastered', 'paused'], 
    default: 'active' 
  },
  
  // History of reviews for analytics
  history: [{
    date: { type: Date, default: Date.now },
    quality: { type: Number }, // 0-5 rating
    confidenceChange: { type: Number }
  }]
}, {
  timestamps: true
});

// Index for efficient querying of upcoming revisions
revisionScheduleSchema.index({ student: 1, nextReview: 1 });
revisionScheduleSchema.index({ student: 1, concept: 1 }, { unique: true });

module.exports = mongoose.model('RevisionSchedule', revisionScheduleSchema);
