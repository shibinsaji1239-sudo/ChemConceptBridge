const mongoose = require('mongoose');

const cognitiveLogSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true }, // Group interactions by session
  
  // Interaction Data
  activityType: { type: String, enum: ['quiz', 'concept_map', 'video', 'reading', 'chemical_equation', 'experiment', 'other'], required: true },
  resourceId: { type: mongoose.Schema.Types.Mixed }, // Reference to Quiz, Video, etc. (Mixed to allow string IDs for mocks)
  
  // Detailed Metrics
  questionId: { type: mongoose.Schema.Types.ObjectId }, // If quiz
  timeSpent: { type: Number, required: true }, // milliseconds
  retryCount: { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },
  mouseDistance: { type: Number, default: 0 }, // Optional: total pixels moved (proxy for agitation)
  tabSwitches: { type: Number, default: 0 },
  
  // Real-time Status (Calculated)
  cognitiveState: { 
    type: String, 
    enum: ['focused', 'overloaded', 'fatigued', 'overconfident', 'distracted', 'unknown'],
    default: 'unknown'
  },
  
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for quick retrieval by session and student
cognitiveLogSchema.index({ student: 1, sessionId: 1 });

module.exports = mongoose.model('CognitiveLog', cognitiveLogSchema);
