const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Student report (personal performance)
router.get('/student', authMiddleware, reportController.generateStudentReport);

// Teacher report (class summary)
router.get('/teacher', authMiddleware, roleMiddleware('teacher', 'admin'), reportController.generateTeacherReport);

// Concept PDF (study notes)
router.get('/concept/:conceptId', authMiddleware, reportController.generateConceptPDF);

// Mastery Certificate (Student only)
router.get('/certificate/:conceptId', authMiddleware, reportController.generateMasteryCertificate);

// Institution Outcome Report (Admin only)
router.get('/institution', authMiddleware, roleMiddleware('admin'), reportController.generateInstitutionReport);

module.exports = router;
