const RevisionSchedule = require('../models/RevisionSchedule');
const Concept = require('../models/Concept');
const { calculateSM2 } = require('../utils/spacedRepetition');

exports.getSchedule = async (req, res) => {
  try {
    const studentId = req.user.id;
    const today = new Date();
    
    // Get all active revisions due today or earlier
    const dueRevisions = await RevisionSchedule.find({
      student: studentId,
      nextReview: { $lte: today },
      status: 'active'
    }).populate('concept', 'title topic difficulty');

    // Get upcoming revisions (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingRevisions = await RevisionSchedule.find({
      student: studentId,
      nextReview: { $gt: today, $lte: nextWeek },
      status: 'active'
    }).populate('concept', 'title topic difficulty');

    res.json({
      due: dueRevisions,
      upcoming: upcomingRevisions
    });
  } catch (err) {
    console.error('Get Schedule Error:', err);
    res.status(500).json({ error: 'Failed to fetch revision schedule' });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { conceptId, quality } = req.body; // quality 0-5
    const studentId = req.user.id;

    let schedule = await RevisionSchedule.findOne({ student: studentId, concept: conceptId });

    if (!schedule) {
      // First time scheduling
      const nextDate = new Date();
      const sm2Result = calculateSM2(quality, 0, 0, 2.5);
      nextDate.setDate(nextDate.getDate() + sm2Result.interval);

      schedule = new RevisionSchedule({
        student: studentId,
        concept: conceptId,
        interval: sm2Result.interval,
        repetitionCount: sm2Result.repetitions,
        easeFactor: sm2Result.easeFactor,
        nextReview: nextDate,
        history: [{ quality }]
      });
    } else {
      // Updating existing schedule
      const sm2Result = calculateSM2(
        quality, 
        schedule.repetitionCount, 
        schedule.interval, 
        schedule.easeFactor
      );

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
    res.json({ message: 'Revision schedule updated', nextReview: schedule.nextReview });
  } catch (err) {
    console.error('Update Progress Error:', err);
    res.status(500).json({ error: 'Failed to update revision progress' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const schedules = await RevisionSchedule.find({ student: studentId });

    const stats = {
      total: schedules.length,
      mastered: schedules.filter(s => s.repetitionCount > 5).length,
      active: schedules.filter(s => s.status === 'active').length,
      averageEase: schedules.length > 0 
        ? schedules.reduce((acc, s) => acc + s.easeFactor, 0) / schedules.length 
        : 0
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch revision statistics' });
  }
};
