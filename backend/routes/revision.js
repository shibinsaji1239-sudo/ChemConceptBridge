const express = require('express');
const router = express.Router();
const revisionController = require('../controllers/revisionController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/schedule', authMiddleware, revisionController.getSchedule);
router.post('/update', authMiddleware, revisionController.updateProgress);
router.get('/stats', authMiddleware, revisionController.getStats);

module.exports = router;
