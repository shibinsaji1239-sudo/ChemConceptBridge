const mongoose = require('mongoose');

const experimentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  classLevel: { type: Number },
  animation: String,
  apparatus: [String],
  steps: [String],
  expectedResult: String,
  safetyPrecautions: String,
  principles: String,
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  videos: [
    {
      title: String,
      url: String,
      description: String,
      type: { type: String, enum: ['mp4', 'youtube', 'other'], default: 'mp4' }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Experiment', experimentSchema);
