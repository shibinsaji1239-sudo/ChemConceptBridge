const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const optionalAuth = require('../middleware/optionalAuth');

console.log("✅ Chat Routes Loaded");

router.get('/test', (req, res) => {
    res.json({ message: "Chat route is working!" });
});

router.post('/message', optionalAuth, (req, res, next) => {
    console.log("📩 Received chat message request");
    chatController.chat(req, res, next);
});

module.exports = router;
