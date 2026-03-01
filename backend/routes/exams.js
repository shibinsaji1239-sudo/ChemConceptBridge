const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');

const canManage = (req) => ['teacher', 'admin'].includes(req.user.role);

function scoreDescriptive(answerText = '', keywords = [], marks = 1) {
  if (!answerText || keywords.length === 0) return 0;
  const text = String(answerText).toLowerCase();
  const hits = keywords.filter(k => text.includes(String(k).toLowerCase())).length;
  const ratio = Math.min(1, hits / Math.max(1, keywords.length));
  return Math.round(ratio * marks);
}

function evaluateQuestion(q, response, negative = 0) {
  let awarded = 0;
  switch (q.type) {
    case 'mcq': {
      const correct = Number(q.correctIndex);
      awarded = Number(response) === correct ? q.marks : -negative;
      break;
    }
    case 'numerical': {
      const num = Number(response);
      awarded = (Number.isFinite(num) && Math.abs(num - Number(q.numericAnswer)) < 1e-6) ? q.marks : -negative;
      break;
    }
    case 'equation': {
      const norm = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
      awarded = norm(response) === norm(q.equationAnswer) ? q.marks : -negative;
      break;
    }
    case 'descriptive': {
      awarded = scoreDescriptive(response, q.keywords || [], q.marks);
      break;
    }
    case 'assertion-reason': {
      // Expect response like { assertion: true/false, reason: true/false, relation: true/false }
      try {
        const r = response || {};
        const correct = q.correctIndex; // optional indexing of patterns
        // Simple: both true and relation true earns marks, else partial 0
        awarded = (r.assertion && r.reason && r.relation) ? q.marks : 0;
      } catch { awarded = 0; }
      break;
    }
    case 'diagram': {
      // Expect response as array of {key, value}
      const expected = new Map((q.diagramLabels || []).map(d => [String(d.key).toLowerCase(), String(d.value).toLowerCase()]));
      let correct = 0;
      (Array.isArray(response) ? response : []).forEach(d => {
        const k = String(d.key || '').toLowerCase();
        const v = String(d.value || '').toLowerCase();
        if (expected.has(k) && expected.get(k) === v) correct += 1;
      });
      const ratio = Math.min(1, correct / Math.max(1, expected.size));
      awarded = Math.round(ratio * q.marks);
      break;
    }
    case 'multi-step': {
      // Accept array of steps; award proportionally if non-empty
      const steps = Array.isArray(response) ? response.length : 0;
      awarded = steps > 0 ? Math.round(q.marks * 0.5) : 0;
      break;
    }
    default:
      awarded = 0;
  }
  return Math.max(0, awarded); // do not go below 0 in formal exam
}

// Create exam (Teacher/Admin)
router.post('/', auth, async (req, res) => {
  try {
    if (!canManage(req)) return res.status(403).json({ message: 'Access denied' });
    const payload = req.body || {};
    const exam = await Exam.create({ ...payload, createdBy: req.user.id });
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List exams
router.get('/', auth, async (req, res) => {
  try {
    const query = { isActive: true };
    if (canManage(req)) query.createdBy = req.user.id; // list own exams by default
    const exams = await Exam.find(query).sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one exam
router.get('/:id', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start attempt (Student)
router.post('/:id/attempt/start', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    // Schedule check
    const now = new Date();
    if (exam.schedule?.startTime && now < new Date(exam.schedule.startTime)) {
      return res.status(403).json({ message: 'Exam has not started yet' });
    }
    if (exam.schedule?.endTime && now > new Date(exam.schedule.endTime)) {
      return res.status(403).json({ message: 'Exam window has ended' });
    }

    const attempt = await ExamAttempt.create({ exam: exam._id, student: req.user.id, integrity: {} });

    // Sanitize questions (do not leak answer keys)
    const sanitized = exam.toObject();
    sanitized.questions = (sanitized.questions || []).map(q => ({
      _id: q._id,
      type: q.type,
      text: q.text,
      options: q.options,
      marks: q.marks,
      section: q.section,
    }));

    res.json({ attemptId: attempt._id, exam: sanitized });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log integrity event
router.post('/:id/attempt/:attemptId/log', auth, async (req, res) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.attemptId);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    const { event } = req.body || {};
    attempt.integrity = attempt.integrity || {};
    attempt.integrity.logs = (attempt.integrity.logs || []).concat({ event });
    if (event === 'tab-switch') attempt.integrity.tabSwitchCount = (attempt.integrity.tabSwitchCount || 0) + 1;
    if (event === 'fullscreen-exit') attempt.integrity.fullscreenExitCount = (attempt.integrity.fullscreenExitCount || 0) + 1;
    if (event === 'copy-paste') attempt.integrity.copyPasteAttempts = (attempt.integrity.copyPasteAttempts || 0) + 1;
    await attempt.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit attempt
router.post('/:id/attempt/:attemptId/submit', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    const attempt = await ExamAttempt.findById(req.params.attemptId);
    if (!exam || !attempt) return res.status(404).json({ message: 'Exam or attempt not found' });
    if (String(attempt.student) !== req.user.id) return res.status(403).json({ message: 'Not your attempt' });

    const { responses } = req.body || {}; // [{ questionId, response, timeSpentSec }]
    const negative = Number(exam.negativeMarking || 0);
    let total = 0;

    const byId = new Map((exam.questions || []).map(q => [String(q._id), q]));
    attempt.answers = (responses || []).map(r => {
      const q = byId.get(String(r.questionId));
      if (!q) return { questionId: r.questionId, response: r.response, timeSpentSec: r.timeSpentSec || 0, awardedMarks: 0 };
      const awarded = evaluateQuestion(q, r.response, negative);
      total += awarded;
      return { questionId: r.questionId, response: r.response, timeSpentSec: r.timeSpentSec || 0, awardedMarks: awarded };
    });

    // Integrity score (simple heuristic)
    const integ = attempt.integrity || {};
    const penalties = (integ.tabSwitchCount || 0) * 2 + (integ.fullscreenExitCount || 0) * 3 + (integ.copyPasteAttempts || 0) * 5;
    const maxPenalty = Math.max(1, exam.totalMarks || 100);
    const integrityScore = Math.max(0, Math.round(100 - Math.min(100, (penalties / maxPenalty) * 100)));
    attempt.integrity.suspiciousActivityScore = 100 - integrityScore;

    attempt.totalScore = total;
    attempt.submitted = true;
    attempt.completedAt = new Date();
    await attempt.save();

    res.json({ totalScore: total, integrityScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics (Teacher/Admin)
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    if (!canManage(req)) return res.status(403).json({ message: 'Access denied' });
    const attempts = await ExamAttempt.find({ exam: req.params.id }).populate('student', 'name email');
    const avgScore = attempts.reduce((s, a) => s + (a.totalScore || 0), 0) / Math.max(1, attempts.length);
    const integrityAvg = attempts.reduce((s, a) => s + (100 - (a.integrity?.suspiciousActivityScore || 0)), 0) / Math.max(1, attempts.length);
    res.json({ totalAttempts: attempts.length, averageScore: avgScore, averageIntegrity: Math.round(integrityAvg), attempts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

