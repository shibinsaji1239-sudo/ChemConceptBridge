const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId },
  response: { type: mongoose.Schema.Types.Mixed },
  timeSpentSec: { type: Number, default: 0 },
  awardedMarks: { type: Number, default: 0 },
});

const IntegritySchema = new mongoose.Schema({
  tabSwitchCount: { type: Number, default: 0 },
  fullscreenExitCount: { type: Number, default: 0 },
  copyPasteAttempts: { type: Number, default: 0 },
  suspiciousActivityScore: { type: Number, default: 0 },
  logs: [{ event: String, at: { type: Date, default: Date.now } }],
});

const ExamAttemptSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [AnswerSchema],
  totalScore: { type: Number, default: 0 },
  integrity: IntegritySchema,
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  submitted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ExamAttempt', ExamAttemptSchema);

