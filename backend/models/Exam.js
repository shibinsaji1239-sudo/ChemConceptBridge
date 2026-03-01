const mongoose = require('mongoose');

const ExamQuestionSchema = new mongoose.Schema({
  type: { type: String, enum: ['mcq', 'descriptive', 'numerical', 'equation', 'diagram', 'assertion-reason', 'multi-step'], required: true },
  text: { type: String, required: true },
  options: [{ type: String }],
  correctIndex: { type: Number },
  keywords: [{ type: String }],
  numericAnswer: { type: Number },
  equationAnswer: { type: String },
  diagramLabels: [{ key: String, value: String }],
  marks: { type: Number, default: 1 },
  section: { type: String, default: 'A' },
});

const ExamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  topic: { type: String },
  difficultyMix: { type: String, default: 'mixed' },
  durationMinutes: { type: Number, required: true },
  totalMarks: { type: Number, default: 100 },
  negativeMarking: { type: Number, default: 0 },
  randomize: { type: Boolean, default: true },
  sections: [{ name: String, weight: Number }],
  questions: [ExamQuestionSchema],
  schedule: {
    startTime: { type: Date },
    endTime: { type: Date },
  },
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Exam', ExamSchema);

