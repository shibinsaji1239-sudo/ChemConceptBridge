const mongoose = require('mongoose');

/**
 * Concept Dependency Knowledge Graph
 * Stores prerequisite relationships and dependency weights
 */
const conceptDependencySchema = new mongoose.Schema({
  sourceConcept: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Concept', 
    required: true,
    index: true
  },
  targetConcept: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Concept', 
    required: true,
    index: true
  },
  dependencyType: {
    type: String,
    enum: ['prerequisite', 'strongly_related', 'weakly_related', 'blocks'],
    default: 'prerequisite'
  },
  dependencyWeight: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 1.0
  },
  // Risk prediction metadata
  riskScore: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1.0
  },
  // How many students struggled with target when weak in source
  historicalFailureRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1.0
  },
  // Confidence in this dependency relationship
  confidence: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1.0
  },
  // Metadata
  verified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date }
}, {
  timestamps: true
});

// Compound index to ensure unique dependencies
conceptDependencySchema.index({ sourceConcept: 1, targetConcept: 1 }, { unique: true });

// Index for fast graph traversal
conceptDependencySchema.index({ targetConcept: 1, dependencyType: 1 });

module.exports = mongoose.model('ConceptDependency', conceptDependencySchema);
