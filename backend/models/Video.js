const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['mp4', 'youtube', 'other'], default: 'mp4' },
  experimentTitle: String,
  visibility: { type: String, enum: ['public', 'private'], default: 'public' }
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
