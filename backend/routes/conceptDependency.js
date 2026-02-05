const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/conceptDependencyController');

// Get knowledge graph
router.get('/graph', auth, ctrl.buildKnowledgeGraph);

// Predict risk for a specific concept
router.get('/risk/:userId', auth, ctrl.predictRisk);

// Get full risk analysis for a student
router.get('/risk-analysis/:userId', auth, ctrl.getRiskAnalysis);

// Update dependency weights (admin/teacher only)
router.post('/update-weights', auth, ctrl.updateDependencyWeights);

module.exports = router;
