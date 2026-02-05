const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/videoController');

router.get('/', auth, ctrl.listVideos);
router.post('/', auth, role('teacher'), ctrl.createVideo);
router.put('/:id', auth, role('teacher'), ctrl.updateVideo);
router.delete('/:id', auth, role('admin', 'teacher'), ctrl.deleteVideo);

module.exports = router;
