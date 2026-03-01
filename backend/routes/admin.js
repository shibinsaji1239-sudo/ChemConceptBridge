const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Concept = require("../models/Concept");
const Quiz = require("../models/Quiz");
const ConceptMap = require("../models/ConceptMap");
const auth = require("../middleware/authMiddleware");
const allow = require("../middleware/roleMiddleware");
const SystemSettings = require("../models/SystemSettings");

const router = express.Router();

// All admin routes require auth + admin role
router.use(auth, allow("admin"));

// Create user with specific role (teacher or student)
router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role, assignedTeacher } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password, role are required" });
    }
    if (["teacher", "student"].includes(role) === false) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const doc = { name, email, password: hashedPassword, role };
    if (role === 'student' && assignedTeacher) {
      const teacher = await User.findById(assignedTeacher).select('_id role');
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({ message: "assignedTeacher must be a valid teacher id" });
      }
      doc.assignedTeacher = teacher._id;
    }
    const user = await User.create(doc);
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role, assignedTeacher: user.assignedTeacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change user role
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: "role is required" });
    if (["student", "teacher", "admin"].includes(role) === false) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics: Users by role (optional ?role=student|teacher|admin)
router.get("/analytics/users-by-role", async (req, res) => {
  try {
    const { role } = req.query;
    const match = {};
    if (role) {
      if (["student", "teacher", "admin"].includes(role) === false) {
        return res.status(400).json({ message: "Invalid role filter" });
      }
      match.role = role;
    }

    const pipeline = [
      { $match: match },
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ];

    const results = await User.aggregate(pipeline);
    const counts = { admin: 0, teacher: 0, student: 0 };
    results.forEach(r => {
      if (r && r._id) counts[r._id] = r.count;
    });

    res.json(counts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Summary counts for admin dashboard
router.get("/summary", async (req, res) => {
  try {
    const [
      totalUsers,
      totalConcepts,
      approvedConcepts,
      totalConceptMaps,
      approvedConceptMaps,
      totalQuizzes,
      activeQuizzes,
      conceptsByStatus,
      quizzesByDifficulty
    ] = await Promise.all([
      User.countDocuments({}),
      Concept.countDocuments({}),
      Concept.countDocuments({ status: "approved", isActive: true }),
      ConceptMap.countDocuments({}),
      ConceptMap.countDocuments({ status: "approved", isActive: true }),
      Quiz.countDocuments({}),
      Quiz.countDocuments({ isActive: true }),
      // Aggregate concepts by status
      Concept.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      // Aggregate quizzes by difficulty
      Quiz.aggregate([
        { $group: { _id: "$difficulty", count: { $sum: 1 } } }
      ])
    ]);

    // Process concept status aggregation
    const conceptStatusCounts = { pending: 0, approved: 0, rejected: 0, draft: 0 };
    conceptsByStatus.forEach(item => {
      if (item._id && conceptStatusCounts.hasOwnProperty(item._id)) {
        conceptStatusCounts[item._id] = item.count;
      }
    });

    // Process quiz difficulty aggregation
    const quizDifficultyCounts = { Beginner: 0, Intermediate: 0, Advanced: 0 };
    quizzesByDifficulty.forEach(item => {
      if (item._id) {
        // Map the difficulty levels to lowercase for frontend consistency
        const key = item._id;
        if (key === "Beginner") quizDifficultyCounts.easy = item.count;
        else if (key === "Intermediate") quizDifficultyCounts.medium = item.count;
        else if (key === "Advanced") quizDifficultyCounts.hard = item.count;
      }
    });

    res.json({
      users: { total: totalUsers },
      concepts: { total: totalConcepts, approvedActive: approvedConcepts },
      conceptMaps: { total: totalConceptMaps, approvedActive: approvedConceptMaps },
      quizzes: { total: totalQuizzes, active: activeQuizzes },
      conceptsByStatus: {
        pending: conceptStatusCounts.pending,
        approved: conceptStatusCounts.approved,
        rejected: conceptStatusCounts.rejected
      },
      quizzesByDifficulty: {
        easy: quizDifficultyCounts.easy,
        medium: quizDifficultyCounts.medium,
        hard: quizDifficultyCounts.hard
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// System Settings APIs
// =====================
router.get("/system-settings", async (req, res) => {
  try {
    const settings = await SystemSettings.getSingleton();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/system-settings", async (req, res) => {
  try {
    const allowed = [
      "maintenanceMode",
      "allowRegistration",
      "conceptMapEnabled",
      "analyticsEnabled",
      "chemicalEquationsEnabled",
      "aiThoughtPathRecorderEnabled"
    ];

    const update = {};
    for (const key of allowed) {
      if (typeof req.body[key] !== "undefined") {
        update[key] = !!req.body[key];
      }
    }

    const settings = await SystemSettings.getSingleton();
    Object.assign(settings, update);
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
