const express = require("express");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const auth = require("../middleware/authMiddleware");
const Gamification = require("../models/Gamification");
const UserProgress = require("../models/UserProgress");
const { checkBadgeUnlocks, getQuizXp } = require("../utils/badgeDefinitions");
const { generateQuestions } = require("../utils/questionGenerator");
const { updateConceptWeight } = require("../services/smartConceptRouter");

const router = express.Router();

// Helper function to normalize question text for deduplication
const normalizeQuestionText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
};

// Helper function to remove duplicate questions from an array
const removeDuplicateQuestions = (questions) => {
  if (!Array.isArray(questions)) return [];
  
  const uniqueQuestions = [];
  const seenQuestions = new Map();
  
  questions.forEach(q => {
    if (!q || !q.question) return;
    
    const normalizedText = normalizeQuestionText(q.question);
    
    if (normalizedText && !seenQuestions.has(normalizedText)) {
      seenQuestions.set(normalizedText, true);
      uniqueQuestions.push(q);
    }
  });
  
  return uniqueQuestions;
};

// Get all quizzes
router.get("/", async (req, res) => {
  try {
    const { topic, difficulty } = req.query;
    let query = { isActive: true };
    
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;
    
    const quizzesDocs = await Quiz.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const quizzes = quizzesDocs.map(q => {
      const o = q.toObject();
      if (Array.isArray(o.questions)) {
        // Remove duplicates when returning quizzes (use question text as primary key)
        const uniqueQuestions = [];
        const seenQuestions = new Map(); // Map to track first occurrence
        
        o.questions.forEach(qq => {
          if (!qq || !qq.question) return;
          
          const normalizedText = normalizeQuestionText(qq.question);
          
          // Only add if we haven't seen this exact question text before
          if (normalizedText && !seenQuestions.has(normalizedText)) {
            seenQuestions.set(normalizedText, true);
            uniqueQuestions.push({ 
              _id: qq._id, 
              question: qq.question, 
              options: qq.options 
            });
          }
        });
        
        o.questions = uniqueQuestions;
        
        // Log if duplicates were removed
        if (uniqueQuestions.length < q.questions.length) {
          console.log(`Removed ${q.questions.length - uniqueQuestions.length} duplicate(s) from quiz "${q.title}"`);
        }
      }
      return o;
    });
    
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get quiz by ID
router.get("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'name');
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    // Do not leak answer keys to clients other than creator/admin
    const sanitized = quiz.toObject();
    if (Array.isArray(sanitized.questions)) {
      // Remove duplicates when returning quiz
      const uniqueQuestions = [];
      const seenQuestions = new Set();
      
      sanitized.questions.forEach(q => {
        if (!q || !q.question) return;
        
      const normalizedText = normalizeQuestionText(q.question);
      
      if (normalizedText && !seenQuestions.has(normalizedText)) {
        seenQuestions.add(normalizedText);
        uniqueQuestions.push({
          _id: q._id,
          question: q.question,
          options: q.options,
          // hide correct index and explanation until after attempt
        });
      }
      });
      
      sanitized.questions = uniqueQuestions;
    }
    
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new quiz (Teacher/Admin only)
router.post("/", auth, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Validate payload
    const { title, description, topic, difficulty, duration, questions } = req.body || {};
    const allowedDifficulties = ["Beginner", "Intermediate", "Advanced"];
    if (!title || !description || !topic || !difficulty || typeof duration !== 'number' || duration <= 0) {
      return res.status(400).json({ message: "title, description, topic, difficulty, positive numeric duration are required" });
    }
    if (!allowedDifficulties.includes(difficulty)) {
      return res.status(400).json({ message: "Invalid difficulty" });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "At least one question is required" });
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q || typeof q.question !== 'string' || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ message: `Question ${i + 1} must have text and at least 2 options` });
      }
      if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) {
        return res.status(400).json({ message: `Question ${i + 1} has invalid correct option index` });
      }
      if (!q.explanation || typeof q.explanation !== 'string') {
        return res.status(400).json({ message: `Question ${i + 1} must include an explanation` });
      }
    }

    // Remove duplicate questions within the same quiz
    const uniqueQuestions = removeDuplicateQuestions(questions);

    if (uniqueQuestions.length === 0) {
      return res.status(400).json({ message: "All questions are duplicates. Please provide unique questions." });
    }

    if (uniqueQuestions.length < questions.length) {
      console.log(`Removed ${questions.length - uniqueQuestions.length} duplicate questions from quiz creation`);
    }

    const quiz = new Quiz({
      title, description, topic, difficulty, duration, questions: uniqueQuestions,
      createdBy: req.user.id
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit quiz attempt
router.post("/:id/attempt", auth, async (req, res) => {
  try {
    const { answers, timeSpent, confidenceLevel } = req.body || {};
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "answers array is required" });
    }
    if (typeof timeSpent !== 'number' || timeSpent < 0) {
      return res.status(400).json({ message: "timeSpent must be a non-negative number (seconds)" });
    }
    
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    // Normalize confidence: accept 1-5 or 0-100
    let normalizedConfidence = undefined;
    if (typeof confidenceLevel === 'number') {
      if (confidenceLevel > 5) {
        // treat as percentage and map to 1..5
        const pct = Math.max(0, Math.min(100, confidenceLevel));
        normalizedConfidence = Math.max(1, Math.min(5, Math.round((pct / 100) * 5)));
      } else if (confidenceLevel >= 1 && confidenceLevel <= 5) {
        normalizedConfidence = Math.round(confidenceLevel);
      }
    }

    // Calculate score
    let correct = 0;
    const detailedAnswers = answers.map((answer) => {
      const question = quiz.questions.find(q => q._id.toString() === String(answer.questionId));
      if (!question) {
        throw new Error("Invalid questionId in answers");
      }
      if (typeof answer.selectedOption !== 'number' || answer.selectedOption < 0 || answer.selectedOption >= question.options.length) {
        throw new Error("Invalid selectedOption index in answers");
      }
      const isCorrect = answer.selectedOption === question.correct;
      if (isCorrect) correct++;
      
      return {
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect,
        timeSpent: answer.timeSpent || 0
      };
    });
    
    const score = Math.round((correct / quiz.questions.length) * 100);
    
    // Detect misconceptions (simplified)
    const misconceptions = [];
    detailedAnswers.forEach(answer => {
      if (!answer.isCorrect) {
        const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
        if (Array.isArray(question.misconceptionTraps)) {
          const trap = question.misconceptionTraps[answer.selectedOption];
          if (trap) misconceptions.push(trap);
        }
      }
    });
    
    // Create attempt record
    const attempt = new QuizAttempt({
      student: req.user.id,
      quiz: req.params.id,
      answers: detailedAnswers,
      score,
      timeSpent,
      confidenceLevel: normalizedConfidence,
      misconceptions
    });
    
    await attempt.save();
    
    // Update quiz statistics
    quiz.attempts += 1;
    quiz.averageScore = ((quiz.averageScore * (quiz.attempts - 1)) + score) / quiz.attempts;
    await quiz.save();

    // Enhanced gamification: award XP based on difficulty and score
    try {
      const xpReward = getQuizXp(score, quiz.difficulty);
      
      // Get or create gamification record
      let gamification = await Gamification.findOne({ user: req.user.id });
      if (!gamification) {
        gamification = new Gamification({ user: req.user.id });
      }

      // Update XP and stats
      gamification.xp += xpReward;
      gamification.totalQuizzesCompleted = (gamification.totalQuizzesCompleted || 0) + 1;
      gamification.lastActivityAt = new Date();
      
      // Update average score
      const oldTotal = (gamification.averageQuizScore || 0) * (gamification.totalQuizzesCompleted - 1);
      gamification.averageQuizScore = (oldTotal + score) / gamification.totalQuizzesCompleted;

      // Gather stats for badge checking
      const userAttempts = await QuizAttempt.find({ student: req.user.id }).lean();
      const userProgress = await UserProgress.findOne({ user: req.user.id });
      
      const stats = {
        quizzesCompleted: gamification.totalQuizzesCompleted,
        perfectScores: userAttempts.filter(a => a.score === 100).length,
        averageAccuracy: gamification.averageQuizScore || 0,
        consecutiveHighScores: 0, // Simplified: would need to calculate consecutive scores >= 80
        currentStreak: gamification.streakDays || 0,
        topicsLearned: (userProgress?.completedTopics?.length || 0)
      };

      // Check for badge unlocks
      const newBadges = checkBadgeUnlocks(gamification.badges || [], stats);
      
      if (newBadges.length > 0) {
        const badgesToAdd = newBadges.map(badge => ({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          xpReward: badge.xpReward,
          unlockedAt: new Date()
        }));

        // Ensure existing badges conform to schema (migrate/ignore malformed entries)
        const existingValidBadges = (gamification.badges || []).filter(b => (
          b && b.id && b.name && b.description && b.icon && b.category && b.unlockedAt
        ));
        gamification.badges = [...existingValidBadges, ...badgesToAdd];
        
        // Award XP for badges
        const badgeXpBonus = badgesToAdd.reduce((sum, b) => sum + b.xpReward, 0);
        gamification.xp += badgeXpBonus;
      }

      await gamification.save();

      // NEW: Revision Scheduler Integration
      try {
        const Concept = require('../models/Concept');
        const RevisionSchedule = require('../models/RevisionSchedule');
        const { calculateSM2 } = require('../utils/spacedRepetition');

        // Find a related concept for this quiz topic
        const concept = await Concept.findOne({ topic: quiz.topic });
        if (concept) {
          // Map quiz score (0-100) to SM2 quality (0-5)
          const quality = Math.floor(score / 20); // 0-20=0, 21-40=1, 41-60=2, 61-80=3, 81-90=4, 91-100=5
          
          let schedule = await RevisionSchedule.findOne({ student: req.user.id, concept: concept._id });
          
          if (!schedule) {
            const sm2Result = calculateSM2(quality, 0, 0, 2.5);
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + sm2Result.interval);
            
            schedule = new RevisionSchedule({
              student: req.user.id,
              concept: concept._id,
              interval: sm2Result.interval,
              repetitionCount: sm2Result.repetitions,
              easeFactor: sm2Result.easeFactor,
              nextReview: nextDate,
              history: [{ quality }]
            });
          } else {
            const sm2Result = calculateSM2(quality, schedule.repetitionCount, schedule.interval, schedule.easeFactor);
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + sm2Result.interval);
            
            schedule.interval = sm2Result.interval;
            schedule.repetitionCount = sm2Result.repetitions;
            schedule.easeFactor = sm2Result.easeFactor;
            schedule.lastReviewed = new Date();
            schedule.nextReview = nextDate;
            schedule.history.push({ quality });
          }
          await schedule.save();
          console.log(`[REVISION] Schedule updated for user ${req.user.id} on concept ${concept.title}`);
        }
      } catch (revErr) {
        console.error('Revision trigger error:', revErr);
      }

      // Smart Concept Graph Integration: Update weights on failure or ensure node on success
      try {
        const { ensureConceptInGraph, updateConceptWeight, reduceConceptWeight } = require('../services/smartConceptRouter');
        
        // Ensure the current topic is in the graph
        await ensureConceptInGraph(quiz.topic);
        
        if (score < 70) {
          const { previousConcept } = req.body;
          if (previousConcept) {
            await updateConceptWeight(quiz.topic, previousConcept);
          } else {
            // Fallback: If no previousConcept provided, we could try to find any existing prerequisite
            // and increment its weight as a general "this concept is hard" signal
            const ConceptGraph = require('../models/ConceptGraph');
            const node = await ConceptGraph.findOne({ concept: quiz.topic });
            if (node && node.prerequisites && node.prerequisites.length > 0) {
              // Increment the weight of the most significant prerequisite
              const sorted = node.prerequisites.sort((a, b) => b.weight - a.weight);
              await updateConceptWeight(quiz.topic, sorted[0].concept);
            }
          }
        } else {
          // Success: Reduce weights for existing prerequisites
          const ConceptGraph = require('../models/ConceptGraph');
          const node = await ConceptGraph.findOne({ concept: quiz.topic });
          if (node && node.prerequisites && node.prerequisites.length > 0) {
            for (const pre of node.prerequisites) {
              await reduceConceptWeight(quiz.topic, pre.concept);
            }
          }
        }
      } catch (graphErr) {
        console.error('Concept Graph update error:', graphErr);
      }

      res.json({
        score,
        correct,
        total: quiz.questions.length,
        misconceptions,
        attemptId: attempt._id,
        xpAwarded: xpReward,
        newBadges: newBadges.map(b => ({
          id: b.id,
          name: b.name,
          description: b.description,
          icon: b.icon
        }))
      });
    } catch (err) {
      console.error('Gamification error:', err);
      // Still return attempt success even if gamification fails
      res.json({
        score,
        correct,
        total: quiz.questions.length,
        misconceptions,
        attemptId: attempt._id,
        xpAwarded: 0,
        newBadges: []
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get student's quiz attempts
router.get("/attempts/student", auth, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ student: req.user.id })
      .populate('quiz', 'title topic difficulty')
      .sort({ completedAt: -1 });
    
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Secure review endpoint: returns correct answers and explanations for student's own attempt
router.get("/attempts/:id/review", auth, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }
    if (attempt.student.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const quiz = await Quiz.findById(attempt.quiz);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const answers = attempt.answers.map(a => {
      const q = quiz.questions.find(q => q._id.toString() === String(a.questionId)) || {};
      const correctIndex = typeof q.correct === 'number' ? q.correct : null;
      const correctText = (Array.isArray(q.options) && correctIndex != null) ? q.options[correctIndex] : '';
      const selectedIndex = typeof a.selectedOption === 'number' ? a.selectedOption : null;
      const userAnswerText = (Array.isArray(q.options) && selectedIndex != null) ? q.options[selectedIndex] : '';
      return {
        questionId: a.questionId,
        question: q.question || '',
        options: q.options || [],
        topic: quiz.topic || '',
        correctIndex,
        correctText,
        selectedIndex,
        userAnswer: userAnswerText,
        isCorrect: a.isCorrect,
        explanation: q.explanation || ''
      };
    });

    res.json({
      quiz: { id: quiz._id, title: quiz.title, topic: quiz.topic },
      answers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get quiz statistics (Teacher/Admin only)
router.get("/:id/stats", auth, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const attempts = await QuizAttempt.find({ quiz: req.params.id })
      .populate('student', 'name email');
    
    const stats = {
      totalAttempts: attempts.length,
      averageScore: attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length || 0,
      completionRate: attempts.length > 0 ? 100 : 0, // Simplified
      commonMisconceptions: {},
      studentPerformance: attempts.map(attempt => ({
        student: attempt.student,
        score: attempt.score,
        timeSpent: attempt.timeSpent,
        confidenceLevel: attempt.confidenceLevel,
        completedAt: attempt.completedAt
      }))
    };
    
    // Count misconceptions
    attempts.forEach(attempt => {
      attempt.misconceptions.forEach(misconception => {
        stats.commonMisconceptions[misconception] = (stats.commonMisconceptions[misconception] || 0) + 1;
      });
    });
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update quiz (Teacher/Admin; teacher can only edit own quiz)
router.put("/:id", auth, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    let quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (req.user.role === 'teacher' && quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own quizzes" });
    }

    const updates = req.body;
    
    // Remove duplicates if questions are being updated
    if (updates.questions && Array.isArray(updates.questions)) {
      updates.questions = removeDuplicateQuestions(updates.questions);
      if (uniqueQuestions.length < updates.questions.length) {
        console.log(`Removed duplicate questions from quiz update`);
      }
    }
    
    quiz.set(updates);
    await quiz.save();
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove duplicate questions from all quizzes (Admin only)
router.post("/cleanup-duplicates", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const allQuizzes = await Quiz.find({ isActive: true });
    let totalRemoved = 0;
    let quizzesUpdated = 0;

    for (const quiz of allQuizzes) {
      if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        continue;
      }

      const uniqueQuestions = [];
      const seenQuestions = new Set();
      let removedFromQuiz = 0;

      quiz.questions.forEach(q => {
        const normalizedText = normalizeQuestionText(q.question);
        if (normalizedText && !seenQuestions.has(normalizedText)) {
          seenQuestions.add(normalizedText);
          uniqueQuestions.push(q);
        } else if (normalizedText) {
          removedFromQuiz++;
        }
      });

      if (removedFromQuiz > 0) {
        quiz.questions = uniqueQuestions;
        await quiz.save();
        totalRemoved += removedFromQuiz;
        quizzesUpdated++;
        console.log(`Quiz "${quiz.title}" (${quiz.topic}): Removed ${removedFromQuiz} duplicate question(s)`);
      }
    }

    res.json({
      message: `Cleanup completed. Removed ${totalRemoved} duplicate questions from ${quizzesUpdated} quiz(zes).`,
      totalRemoved,
      quizzesUpdated,
      totalQuizzes: allQuizzes.length
    });
  } catch (err) {
    console.error("Error cleaning up duplicates:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update quiz status (activate/deactivate) (Teacher/Admin; teacher can only update own quiz)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (req.user.role === 'teacher' && quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own quizzes" });
    }

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: "isActive must be a boolean value" });
    }

    quiz.isActive = isActive;
    await quiz.save();

    res.json({ 
      message: isActive ? "Quiz activated successfully" : "Quiz deactivated successfully",
      quiz
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete quiz (soft delete: isActive=false) (Teacher/Admin; teacher can only delete own quiz)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (req.user.role === 'teacher' && quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own quizzes" });
    }

    quiz.isActive = false;
    await quiz.save();

    res.json({ message: "Quiz deactivated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/seed-attempts", auth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isActive: true }).sort({ createdAt: -1 }).limit(3);
    if (!quizzes || quizzes.length === 0) {
      return res.status(404).json({ message: "No quizzes available" });
    }
    const created = [];
    for (const quiz of quizzes) {
      if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) continue;
      const count = Math.min(5, quiz.questions.length);
      const indices = Array.from({ length: quiz.questions.length }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, count);
      let correct = 0;
      const detailedAnswers = indices.map((qi, idx) => {
        const q = quiz.questions[qi];
        const optionsCount = Array.isArray(q.options) ? q.options.length : 0;
        let selected = q.correct;
        if (idx % 2 === 0 && optionsCount > 1) {
          const pool = Array.from({ length: optionsCount }, (_, i) => i).filter(i => i !== q.correct);
          selected = pool[Math.floor(Math.random() * pool.length)];
        }
        const isCorrect = selected === q.correct;
        if (isCorrect) correct++;
        return { questionId: q._id, selectedOption: selected, isCorrect, timeSpent: Math.floor(3 + Math.random() * 7) };
      });
      const score = Math.round((correct / detailedAnswers.length) * 100);
      const misconceptions = [];
      detailedAnswers.forEach(a => {
        if (!a.isCorrect) {
          const q = quiz.questions.find(qq => String(qq._id) === String(a.questionId));
          if (q && Array.isArray(q.misconceptionTraps)) {
            const t = q.misconceptionTraps[a.selectedOption];
            if (t) misconceptions.push(t);
          }
        }
      });
      const attempt = new QuizAttempt({
        student: req.user.id,
        quiz: quiz._id,
        answers: detailedAnswers,
        score,
        timeSpent: detailedAnswers.reduce((s, a) => s + (a.timeSpent || 0), 0),
        confidenceLevel: 3,
        misconceptions
      });
      await attempt.save();
      quiz.attempts += 1;
      quiz.averageScore = ((quiz.averageScore * (quiz.attempts - 1)) + score) / quiz.attempts;
      await quiz.save();
      try {
        const xpReward = getQuizXp(score, quiz.difficulty);
        let gamification = await Gamification.findOne({ user: req.user.id });
        if (!gamification) gamification = new Gamification({ user: req.user.id });
        gamification.xp += xpReward;
        gamification.totalQuizzesCompleted = (gamification.totalQuizzesCompleted || 0) + 1;
        gamification.lastActivityAt = new Date();
        const oldTotal = (gamification.averageQuizScore || 0) * (gamification.totalQuizzesCompleted - 1);
        gamification.averageQuizScore = (oldTotal + score) / gamification.totalQuizzesCompleted;
        await gamification.save();
      } catch {}
      created.push({ attemptId: attempt._id, quizId: String(quiz._id), score });
    }
    if (created.length === 0) {
      return res.status(404).json({ message: "Unable to seed attempts" });
    }
    res.json({ attemptsCreated: created.length, attempts: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate AI Quiz (Adaptive)
router.post("/generate", auth, async (req, res) => {
  try {
    console.log("Generate Quiz Request:", req.body);
    const { topic, difficulty } = req.body;
    
    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    // Default difficulty if not provided
    const finalDifficulty = difficulty || 'Intermediate';

    // Find quizzes matching the criteria
    let query = { isActive: true, topic: topic };
    if (finalDifficulty && finalDifficulty !== 'Adaptive') {
      query.difficulty = finalDifficulty;
    }

    console.log("Querying quizzes with:", query);
    let sourceQuizzes = await Quiz.find(query);
    console.log(`Found ${sourceQuizzes.length} matching quizzes`);
    
    if (sourceQuizzes.length === 0) {
      console.log("No direct match, attempting fallback...");
      // Fallback 1: try to find any quiz with the topic (any difficulty)
      const fallbackQuizzes = await Quiz.find({ isActive: true, topic: topic });
      console.log(`Found ${fallbackQuizzes.length} fallback quizzes`);
      
      if (fallbackQuizzes.length === 0) {
        // Fallback 2: try case-insensitive topic match
        const caseInsensitiveQuizzes = await Quiz.find({ 
          isActive: true, 
          topic: { $regex: new RegExp(`^${topic}$`, 'i') }
        });
        console.log(`Found ${caseInsensitiveQuizzes.length} case-insensitive matches`);
        
        if (caseInsensitiveQuizzes.length === 0) {
          return res.status(404).json({ 
            message: `No quizzes found for topic "${topic}". Please ensure there are existing quizzes for this topic, or try a different topic.` 
          });
        }
        sourceQuizzes = caseInsensitiveQuizzes;
      } else {
        sourceQuizzes = fallbackQuizzes;
      }
    }

    // Aggregate all questions and remove duplicates
    let allQuestions = [];
    const seenQuestionIds = new Set();
    const seenQuestionTexts = new Set();
    
    sourceQuizzes.forEach(q => {
      if (Array.isArray(q.questions) && q.questions.length > 0) {
        q.questions.forEach(question => {
          // Deduplicate by _id first (most reliable)
          const questionId = question._id ? question._id.toString() : null;
          const normalizedText = normalizeQuestionText(question.question);
          
          // Skip if we've seen this question ID or text before
          if (questionId && seenQuestionIds.has(questionId)) {
            return;
          }
          if (normalizedText && seenQuestionTexts.has(normalizedText)) {
            return;
          }
          
          // Add to arrays and mark as seen
          allQuestions.push(question);
          if (questionId) seenQuestionIds.add(questionId);
          if (normalizedText) seenQuestionTexts.add(normalizedText);
        });
      }
    });

    console.log(`Total unique questions available: ${allQuestions.length}`);

    if (allQuestions.length === 0) {
      return res.status(404).json({ 
        message: `Found quizzes for "${topic}" but they contain no questions. Please contact an administrator.` 
      });
    }

    // Ensure minimum 5 questions
    const minQuestions = Math.min(5, allQuestions.length);
    const maxQuestions = Math.min(10, allQuestions.length);
    
    // Shuffle and select questions (Fisher-Yates shuffle for better randomness)
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }
    let selectedQuestions = allQuestions.slice(0, maxQuestions);

    // Final deduplication pass on selected questions (in case shuffle brought duplicates together)
    const finalUniqueQuestions = removeDuplicateQuestions(selectedQuestions);

    console.log(`Selected ${finalUniqueQuestions.length} unique questions (removed ${selectedQuestions.length - finalUniqueQuestions.length} duplicates)`);

    // One more deduplication pass before saving to ensure no duplicates slip through
    const questionsToSave = removeDuplicateQuestions(finalUniqueQuestions);

    console.log(`Final check: Saving ${questionsToSave.length} unique questions (removed ${finalUniqueQuestions.length - questionsToSave.length} more duplicates)`);

    // Construct quiz with deduplicated questions
    const generatedQuiz = {
      title: `AI Generated ${topic} Quiz`,
      description: `Adaptive quiz generated for ${finalDifficulty} level on ${topic}.`,
      topic: topic,
      difficulty: finalDifficulty,
      duration: Math.ceil(questionsToSave.length * 1.5), // ~1.5 min per question
      questions: questionsToSave, // Use fully deduplicated questions
      createdBy: req.user.id,
      isActive: true
    };

    console.log("Creating new quiz...");
    const newQuiz = new Quiz(generatedQuiz);

    await newQuiz.save();
    console.log("Quiz saved successfully:", newQuiz._id);

    // After save, verify and deduplicate again when returning (safety check)
    const sanitized = newQuiz.toObject();
    if (Array.isArray(sanitized.questions)) {
      const uniqueSanitized = removeDuplicateQuestions(sanitized.questions).map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options
      }));
      
      sanitized.questions = uniqueSanitized;
      
      if (sanitized.questions.length < newQuiz.questions.length) {
        console.log(`Warning: Found ${newQuiz.questions.length - sanitized.questions.length} duplicate(s) after save. Removing from response.`);
      }
    }

    res.json(sanitized);

  } catch (err) {
    console.error("Error generating quiz:", err);
    res.status(500).json({ 
      error: err.message || "Failed to generate quiz. Please try again later." 
    });
  }
});

/**
 * @route   POST /api/quiz/generate-ai
 * @desc    Generate a new quiz using AI (Gemini)
 * @access  Private (Student/Admin)
 */
router.post("/generate-ai", auth, async (req, res) => {
  try {
    const { topic, difficulty, count = 5 } = req.body;
    
    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    console.log(`🤖 AI Quiz Generation: Topic="${topic}", Difficulty="${difficulty || 'Intermediate'}"`);

    const questions = await generateQuestions(topic, difficulty || "Intermediate", count);
    
    if (!questions || questions.length === 0) {
      return res.status(500).json({ message: "AI failed to generate questions. Please try again." });
    }

    // Create a new quiz entry in the database
    const newQuiz = new Quiz({
      title: `AI Expert: ${topic} (${difficulty || 'Intermediate'})`,
      description: `A smart quiz dynamically generated by AI to test your knowledge on ${topic}.`,
      topic: topic,
      difficulty: difficulty || "Intermediate",
      duration: Math.ceil(questions.length * 2), // 2 mins per question for AI generated ones
      questions: questions,
      createdBy: req.user.id,
      isActive: true
    });

    await newQuiz.save();
    console.log(`✅ AI Quiz saved successfully: ${newQuiz._id}`);

    res.json(newQuiz);
  } catch (error) {
    console.error("🔥 AI Generation Route Error:", error);
    res.status(500).json({ 
      message: "Failed to generate AI quiz", 
      error: error.message 
    });
  }
});

module.exports = router;
