const express = require('express');
const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt');
const Concept = require('../models/Concept');
const UserProgress = require('../models/UserProgress');
const Gamification = require('../models/Gamification');
const authMiddleware = require('../middleware/authMiddleware');
const Quiz = require('../models/Quiz');
const { checkBadgeUnlocks, calculateLevel, getQuizXp } = require('../utils/badgeDefinitions');

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get stats for logged-in user
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all quiz attempts for this user
    const attempts = await QuizAttempt.find({ student: userId }).populate('quiz', 'topic');

    const totalQuizzes = attempts.length;

    // Calculate accuracy across all answers
    let totalAnswers = 0;
    let totalCorrect = 0;
    attempts.forEach(a => {
      if (Array.isArray(a.answers)) {
        totalAnswers += a.answers.length;
        totalCorrect += a.answers.filter(ans => ans.isCorrect).length;
      }
    });
    const accuracy = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

    // Concepts learned: prefer explicit completed topics from UserProgress
    const progress = await UserProgress.findOne({ user: userId });
    const completedTopics = new Set(progress?.completedTopics || []);

    // Also include any unique quiz topics attempted (as a fallback/proxy)
    attempts.forEach(a => {
      if (a.quiz && a.quiz.topic) completedTopics.add(a.quiz.topic);
    });
    const conceptsLearned = completedTopics.size;

    // Day streak based on days with activity (completedAt or createdAt)
    const activityDays = new Set(
      attempts
        .map(a => (a.completedAt || a.createdAt))
        .filter(Boolean)
        .map(d => new Date(d).toISOString().slice(0, 10))
    );

    // Count consecutive days up to today
    let currentStreak = 0;
    const dayStr = (date) => date.toISOString().slice(0, 10);
    let cursor = new Date();
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()); // normalize to midnight
    while (activityDays.has(dayStr(cursor))) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    res.json({
      totalQuizzes,
      accuracy,
      conceptsLearned,
      currentStreak
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Performance stats (lite) for dashboard heatmaps
router.get('/performance', authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ student: req.user.id }).populate('quiz', 'title topic');
    const byTopic = {};
    attempts.forEach(a => {
      const t = a.quiz?.topic || 'General';
      byTopic[t] = byTopic[t] || { attempts: 0, totalScore: 0 };
      byTopic[t].attempts += 1;
      byTopic[t].totalScore += a.score;
    });
    const topics = Object.entries(byTopic).map(([topic, v]) => ({ topic, attempts: v.attempts, averageScore: Math.round((v.totalScore / v.attempts) * 10) / 10 }));
    res.json({ topics, totalAttempts: attempts.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Gamification: get my XP, badges, and leaderboard with full stats
router.get('/gamification', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user gamification data
    let gamification = await Gamification.findOne({ user: userId }).populate('user', 'name email');
    if (!gamification) {
      gamification = new Gamification({ user: userId });
      await gamification.save();
    }

    // Calculate level
    const levelInfo = calculateLevel(gamification.xp);

    // Get leaderboard (top 20 students)
    const leaderboard = await Gamification.find({})
      .populate('user', 'name email role')
      .sort({ xp: -1 })
      .limit(20)
      .lean();

    const leaderboardData = leaderboard.map((g, idx) => ({
      rank: idx + 1,
      name: g.user?.name || 'Student',
      xp: g.xp,
      level: calculateLevel(g.xp).level,
      badges: g.badges || [],
      isCurrentUser: g.user?._id?.toString() === userId.toString()
    }));

    // Find user's rank
    const userRank = leaderboardData.find(u => u.isCurrentUser)?.rank || 
                     (await Gamification.countDocuments({ xp: { $gt: gamification.xp } })) + 1;

    res.json({
      personal: {
        xp: gamification.xp,
        level: levelInfo.level,
        progressToNextLevel: levelInfo.progressToNextLevel,
        badges: gamification.badges || [],
        streakDays: gamification.streakDays || 0,
        totalQuizzesCompleted: gamification.totalQuizzesCompleted || 0,
        totalTopicsLearned: gamification.totalTopicsLearned || 0,
        averageQuizScore: gamification.averageQuizScore || 0,
        rank: userRank,
        totalPlayers: await Gamification.countDocuments({})
      },
      leaderboard: leaderboardData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark a concept topic as completed by the logged-in user
// Body: { topic: string }
router.post('/complete-concept', authMiddleware, async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ message: 'topic is required' });
    }

    const userId = req.user.id;
    const progress = await UserProgress.findOneAndUpdate(
      { user: userId },
      { $addToSet: { completedTopics: topic } }, // add unique
      { new: true, upsert: true }
    );

    res.json({ completedTopics: progress.completedTopics });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Teacher creates a student and assigns them to self
// Body: { name, email }
router.post('/students', authMiddleware, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { name, email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    // Set a temporary password, student can reset later via Forgot Password
    const tempPassword = Math.random().toString(36).slice(-8);

    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(tempPassword, 10);

    const student = new User({
      name: name || email.split('@')[0],
      email,
      password: hashed,
      role: 'student',
      assignedTeacher: req.user.id,
    });
    await student.save();

    // Send email with temp password
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        to: student.email,
        from: process.env.EMAIL_USER,
        subject: 'Welcome to ChemConcept Bridge - Your Account Details',
        html: `<p>Hello ${student.name},</p>
               <p>You have been enrolled as a student in ChemConcept Bridge.</p>
               <p>Your temporary password is: <strong>${tempPassword}</strong></p>
               <p>Please log in at ${process.env.FRONTEND_URL}/login and use "Forgot Password" to set a new password.</p>
               <p>If you have any questions, contact your teacher.</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (emailErr) {
        console.error('Failed to send email:', emailErr);
        // Continue anyway, as account is created
    }

    res.status(201).json({
      id: student._id,
      name: student.name,
      email: student.email,
      role: student.role,
      assignedTeacher: student.assignedTeacher,
      // No longer return tempPassword, as it's emailed
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List students assigned to the logged-in teacher
router.get('/students', authMiddleware, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const query = req.user.role === 'teacher' ? { assignedTeacher: req.user.id, role: 'student' } : { role: 'student' };
    const students = await User.find(query).select('name email role assignedTeacher createdAt');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get detailed badge information
router.get('/badges/details', authMiddleware, async (req, res) => {
  try {
    const { BADGES } = require('../utils/badgeDefinitions');
    const badgeList = Object.values(BADGES).map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      xpReward: badge.xpReward
    }));
    res.json({ badges: badgeList });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
