const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOption: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    timeSpent: { type: Number, default: 0 }, // in seconds
    reasoning: { type: String },
    nlpAnalysis: {
      thoughtStructure: { type: Number, min: 0, max: 100 },
      logicalGaps: { type: Number, min: 0, max: 100 },
      clarityScore: { type: Number, min: 0, max: 100 },
      feedback: { type: String }
    }
  }],
  score: { type: Number, required: true }, // percentage
  timeSpent: { type: Number, required: true }, // total time in seconds
  completedAt: { type: Date, default: Date.now },
  misconceptions: [{ type: String }], // detected misconceptions
  confidenceLevel: { type: Number, min: 1, max: 5 } // self-rated confidence
}, {
  timestamps: true
});

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
