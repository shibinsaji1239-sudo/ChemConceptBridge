const mongoose = require("mongoose");

const ConceptGraphSchema = new mongoose.Schema({
  concept: {
    type: String,
    required: true,
    unique: true
  },
  prerequisites: [
    {
      concept: { type: String, required: true },
      weight: { type: Number, default: 0.5, min: 0, max: 1.0 }
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model("ConceptGraph", ConceptGraphSchema);
