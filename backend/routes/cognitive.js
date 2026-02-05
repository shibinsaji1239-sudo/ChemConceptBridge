const express = require('express');
const router = express.Router();
const cognitiveController = require('../controllers/cognitiveController');
const auth = require('../middleware/authMiddleware');

// Log a single interaction (frontend calls this after each question/step)
router.post('/log', auth, cognitiveController.logInteraction);

// Get analysis for a specific session (for real-time feedback or post-session report)
router.get('/session/:sessionId', auth, cognitiveController.getSessionAnalysis);

// Admin/Teacher view of a student's cognitive profile
router.get('/student/:studentId', auth, cognitiveController.getStudentProfile);

module.exports = router;
