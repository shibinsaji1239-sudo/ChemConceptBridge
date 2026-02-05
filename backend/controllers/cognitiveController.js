const CognitiveLog = require('../models/CognitiveLog');
const User = require('../models/User');

// ==========================================
// 🧠 Cognitive Load Analyzer Controller
// ==========================================

// Helper: Simple heuristic analysis (mock AI)
// In a real system, this would call a Python ML model (like mlRoutes.js does)
const analyzeCognitiveState = (metrics) => {
    const { timeSpent, retryCount, clickCount, isCorrect } = metrics;
    
    // Thresholds (tunable)
    const HIGH_TIME = 60000; // 60s
    const LOW_TIME = 5000;   // 5s
    const HIGH_RETRIES = 2;
    const HIGH_CLICKS = 10;  // erratic clicking

    // 1. Cognitive Overload
    // Spending lots of time, retrying, clicking randomly
    if (timeSpent > HIGH_TIME && (retryCount >= HIGH_RETRIES || clickCount > HIGH_CLICKS)) {
        return 'overloaded';
    }

    // 2. Overconfidence
    // Answering too fast and getting it wrong (if isCorrect known)
    // Or just super fast clicking with low time
    if (timeSpent < LOW_TIME && retryCount === 0) {
        // If we knew they got it wrong, it's definitely overconfidence. 
        // Without correctness, it's "rushing/overconfident"
        return 'overconfident'; 
    }

    // 3. Learning Fatigue (Requires historical context, simplified here)
    // If time spent is high but clicks are low (staring at screen)
    if (timeSpent > HIGH_TIME && clickCount < 2) {
        return 'fatigued';
    }

    return 'focused';
};

exports.logInteraction = async (req, res) => {
    try {
        const { 
            sessionId, 
            activityType, 
            resourceId, 
            questionId, 
            timeSpent, 
            retryCount, 
            clickCount,
            mouseDistance,
            tabSwitches
        } = req.body;

        // Perform real-time analysis
        const detectedState = analyzeCognitiveState({ 
            timeSpent, 
            retryCount, 
            clickCount 
        });

        const log = new CognitiveLog({
            student: req.user.id,
            sessionId,
            activityType,
            resourceId,
            questionId,
            timeSpent,
            retryCount,
            clickCount,
            mouseDistance,
            tabSwitches,
            cognitiveState: detectedState
        });

        await log.save();

        res.status(201).json({ 
            message: 'Interaction logged', 
            detectedState,
            analysis: {
                overload: detectedState === 'overloaded',
                fatigue: detectedState === 'fatigued',
                overconfidence: detectedState === 'overconfident'
            }
        });

    } catch (err) {
        console.error("Cognitive Log Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getSessionAnalysis = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const logs = await CognitiveLog.find({ 
            student: req.user.id, 
            sessionId 
        }).sort({ createdAt: 1 });

        if (!logs.length) {
            return res.json({ message: "No data for this session", overloadScore: 0 });
        }

        // Aggregate analysis
        let overloadCount = 0;
        let fatigueCount = 0;
        let overconfidenceCount = 0;

        logs.forEach(log => {
            if (log.cognitiveState === 'overloaded') overloadCount++;
            if (log.cognitiveState === 'fatigued') fatigueCount++;
            if (log.cognitiveState === 'overconfident') overconfidenceCount++;
        });

        const total = logs.length;
        
        res.json({
            sessionDuration: logs.reduce((acc, curr) => acc + curr.timeSpent, 0),
            totalInteractions: total,
            metrics: {
                overloadPercentage: Math.round((overloadCount / total) * 100),
                fatiguePercentage: Math.round((fatigueCount / total) * 100),
                overconfidencePercentage: Math.round((overconfidenceCount / total) * 100)
            },
            timeline: logs.map(l => ({
                time: l.createdAt,
                state: l.cognitiveState,
                duration: l.timeSpent
            }))
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Admin/Teacher: Get student cognitive profile
exports.getStudentProfile = async (req, res) => {
    try {
        const { studentId } = req.params;
        // Check permissions (admin or teacher)
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const logs = await CognitiveLog.find({ student: studentId }).limit(100).sort({ createdAt: -1 });
        
        // Group by activity type
        const byActivity = {};
        logs.forEach(log => {
            if (!byActivity[log.activityType]) byActivity[log.activityType] = [];
            byActivity[log.activityType].push(log.cognitiveState);
        });

        res.json({
            studentId,
            totalLogs: logs.length,
            recentStates: logs.slice(0, 10).map(l => l.cognitiveState),
            activityBreakdown: byActivity
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
