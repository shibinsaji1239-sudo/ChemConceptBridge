/**
 * AI-Generated Learning Path Module
 * Analyzes user quiz history and mastery levels to generate personalized weekly roadmaps
 */

const QuizAttempt = require('../models/QuizAttempt');
const Concept = require('../models/Concept');
const UserProgress = require('../models/UserProgress');
const Quiz = require('../models/Quiz');
const { findMissingConcept } = require('../services/smartConceptRouter');

/**
 * Calculate mastery level for a specific topic based on quiz attempts
 * @param {Array} attempts - Array of QuizAttempt objects for the topic
 * @returns {Object} { mastery: 0-100, attemptCount, averageScore, recentTrend }
 */
function calculateTopicMastery(attempts) {
  if (attempts.length === 0) {
    return { mastery: 0, attemptCount: 0, averageScore: 0, recentTrend: 'new', confidence: 0 };
  }

  const scores = attempts.map(a => a.score || 0);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Recent trend: average of last 3 attempts vs. average of first 3
  const recentScores = scores.slice(-3);
  const earlierScores = scores.slice(0, 3);
  const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const earlierAvg = earlierScores.length > 0 ? earlierScores.reduce((a, b) => a + b, 0) / earlierScores.length : recentAvg;
  
  let recentTrend = 'stable';
  if (recentAvg > earlierAvg + 5) recentTrend = 'improving';
  else if (recentAvg < earlierAvg - 5) recentTrend = 'declining';

  // Mastery calculation: weighted by recency and confidence
  // Higher recent scores and higher confidence = higher mastery
  const recencyWeight = scores.map((_, i) => (i + 1) / scores.length); // Earlier attempts weighted less
  const weightedScore = scores.reduce((sum, score, i) => sum + score * recencyWeight[i], 0) / recencyWeight.reduce((a, b) => a + b, 0);
  
  // Average confidence from attempts
  const avgConfidence = attempts.reduce((sum, a) => sum + (a.confidenceLevel || 3), 0) / attempts.length;
  
  // Mastery = 60% weighted score + 40% confidence boost
  const mastery = Math.round(weightedScore * 0.6 + (avgConfidence / 5) * 100 * 0.4);

  return {
    mastery: Math.min(100, mastery),
    attemptCount: attempts.length,
    averageScore: Math.round(averageScore),
    recentTrend,
    confidence: Math.round(avgConfidence * 20)
  };
}

/**
 * Identify weak areas (topics where student struggles) and strong areas
 * @param {Array} topicStats - Array of { topic, mastery, attemptCount }
 * @returns {Object} { weakAreas, strongAreas, emergingAreas }
 */
function identifyAreasOfFocus(topicStats) {
  // Sort by mastery
  const sorted = [...topicStats].sort((a, b) => a.mastery - b.mastery);

  // Weak areas: mastery < 60% OR declining trend — sorted by mastery gap (most urgent first)
  const weakAreas = sorted
    .filter(t => t.mastery < 60 || t.recentTrend === 'declining')
    .sort((a, b) => {
      // Prioritize by: 1) Declining trend, 2) Lowest mastery, 3) Most attempts (frequent failures)
      if (a.recentTrend === 'declining' && b.recentTrend !== 'declining') return -1;
      if (a.recentTrend !== 'declining' && b.recentTrend === 'declining') return 1;
      return a.mastery - b.mastery || b.attemptCount - a.attemptCount;
    })
    .slice(0, 5);
  
  // Strong areas: mastery >= 80% — sorted by mastery (highest first)
  const strongAreas = sorted
    .filter(t => t.mastery >= 80)
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 3);
  
  // Emerging areas: new topics (1-2 attempts) with moderate scores (50-75%) — sorted by attempt count
  const emergingAreas = sorted
    .filter(t => t.attemptCount <= 2 && t.mastery >= 50 && t.mastery < 80)
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 3);

  return { weakAreas, strongAreas, emergingAreas };
}

/**
 * Generate a personalized weekly learning roadmap
 * @param {String} userId - User's MongoDB ID
 * @returns {Promise<Object>} Roadmap with ranked topics, recommendations, and reasoning
 */
async function generateLearningPath(userId) {
  try {
    // 1. Fetch user's quiz attempts
    const attempts = await QuizAttempt.find({ student: userId })
      .populate({
        path: 'quiz',
        select: 'topic difficulty title'
      })
      .sort({ completedAt: -1 });

    if (attempts.length === 0) {
      // New user: recommend foundational topics
      const foundationalConcepts = await Concept.find({
        difficulty: 'Beginner',
        status: 'approved',
        isActive: true
      })
        .select('title topic difficulty estimatedTime')
        .limit(7);

      return {
        userId,
        generatedAt: new Date(),
        type: 'beginner_path',
        message: 'Welcome! Start with these foundational concepts to build your chemistry knowledge.',
        weeklyTopics: foundationalConcepts.map((concept, idx) => ({
          rank: idx + 1,
          title: concept.title,
          topic: concept.topic,
          difficulty: concept.difficulty,
          estimatedTime: concept.estimatedTime,
          reason: 'Foundational concept for chemistry mastery',
          priority: 'high',
          masteryLevel: 0,
          recommendedAction: 'Start learning'
        })),
        overallRecommendation: 'Begin with Beginner-level concepts to establish a strong foundation.',
        nextSteps: ['Complete at least 3 quizzes to get personalized recommendations', 'Focus on understanding core concepts']
      };
    }

    // 2. Group attempts by topic
    const topicMap = new Map();
    attempts.forEach(attempt => {
      const topic = attempt.quiz?.topic || 'Unknown';
      if (!topicMap.has(topic)) {
        topicMap.set(topic, []);
      }
      topicMap.get(topic).push(attempt);
    });

    // 3. Calculate mastery for each topic
    const topicStats = Array.from(topicMap.entries()).map(([topic, topicAttempts]) => {
      const masteryData = calculateTopicMastery(topicAttempts);
      return {
        topic,
        ...masteryData,
        lastAttempted: topicAttempts[0]?.completedAt
      };
    });

    // 4. Identify areas of focus
    const { weakAreas, strongAreas, emergingAreas } = identifyAreasOfFocus(topicStats);

    // 5. Fetch related concepts for weak areas
    const recommendedTopics = [];
    
    // SMART GRAPH INTEGRATION: Identify most critical prerequisite for the weakest area
    if (weakAreas.length > 0) {
      const weakest = weakAreas[0];
      const missingPrerequisite = await findMissingConcept(weakest.topic);
      
      if (missingPrerequisite) {
        // Find information for the prerequisite
        const prerequisiteConcept = await Concept.findOne({ 
          topic: missingPrerequisite,
          status: 'approved',
          isActive: true
        }).select('title difficulty estimatedTime');

        if (prerequisiteConcept) {
          recommendedTopics.push({
            rank: 1,
            title: prerequisiteConcept.title,
            topic: missingPrerequisite,
            difficulty: prerequisiteConcept.difficulty || 'Beginner',
            estimatedTime: prerequisiteConcept.estimatedTime || 30,
            masteryLevel: 0, // Prerequisite might be unknown
            priority: 'urgent',
            priorityScore: 100,
            reason: `⚡ Smart Graph Recommendation: You're struggling with "${weakest.topic}" because of missing foundation in "${missingPrerequisite}". Focus on this first.`,
            recommendedAction: 'Master Foundation',
            step: 'Step 0: Prerequisite Correction'
          });
        }
      }
    }

    // Priority 1: Most critical weak areas (highest mastery gap)
    for (const weakArea of weakAreas) {
      const concepts = await Concept.find({
        topic: weakArea.topic,
        status: 'approved',
        isActive: true
      })
        .select('title difficulty estimatedTime')
        .sort({ difficulty: 1 }) // Beginner first
        .limit(2);

      concepts.forEach((concept, idx) => {
        recommendedTopics.push({
          rank: recommendedTopics.length + 1,
          title: concept.title,
          topic: weakArea.topic,
          difficulty: concept.difficulty || 'Intermediate',
          estimatedTime: concept.estimatedTime || 30,
          masteryLevel: weakArea.mastery,
          recentTrend: weakArea.recentTrend,
          priority: 'high',
          priorityScore: 100 - weakArea.mastery, // Higher gap = higher priority
          reason: `🔴 Critical: Strengthen weak area "${weakArea.topic}" (${weakArea.mastery}% mastery). This is affecting your overall performance.`,
          recommendedAction: 'Focus here first',
          step: 'Step 1: Foundation'
        });
      });
    }

    // Priority 2: Emerging areas building on foundation
    for (const emergingArea of emergingAreas) {
      const concepts = await Concept.find({
        topic: emergingArea.topic,
        status: 'approved',
        isActive: true
      })
        .select('title difficulty estimatedTime')
        .sort({ difficulty: 1 })
        .limit(1);

      concepts.forEach(concept => {
        recommendedTopics.push({
          rank: recommendedTopics.length + 1,
          title: concept.title,
          topic: emergingArea.topic,
          difficulty: concept.difficulty || 'Intermediate',
          estimatedTime: concept.estimatedTime || 30,
          masteryLevel: emergingArea.mastery,
          recentTrend: emergingArea.recentTrend,
          priority: 'medium',
          priorityScore: 70,
          reason: `🟡 Building: Continue progress on "${emergingArea.topic}" (${emergingArea.mastery}% mastery). You're making good progress here!`,
          recommendedAction: 'Continue learning',
          step: 'Step 2: Reinforcement'
        });
      });
    }

    // Priority 3: Advanced topics (for students with strong foundations)
    const advancedTopics = topicStats.filter(t => t.mastery >= 80).map(t => t.topic);
    if (advancedTopics.length > 0) {
      const advConcepts = await Concept.find({
        topic: { $in: advancedTopics },
        difficulty: 'Advanced',
        status: 'approved',
        isActive: true
      })
        .select('title difficulty estimatedTime')
        .limit(2);

      advConcepts.forEach(concept => {
        recommendedTopics.push({
          rank: recommendedTopics.length + 1,
          title: concept.title,
          topic: concept.topic,
          difficulty: concept.difficulty || 'Advanced',
          estimatedTime: concept.estimatedTime || 40,
          masteryLevel: 80,
          recentTrend: 'improving',
          priority: 'low',
          priorityScore: 30,
          reason: `🟢 Challenge: Master advanced topics in your strong area "${concept.topic}". Time to deepen your expertise!`,
          recommendedAction: 'Expand mastery',
          step: 'Step 3: Advanced'
        });
      });
    }

    // Limit to 7 topics for weekly roadmap
    const weeklyTopics = recommendedTopics.slice(0, 7);

    // 6. Generate overall insights and recommendations
    const avgMastery = Math.round(topicStats.reduce((sum, t) => sum + t.mastery, 0) / topicStats.length);
    const improvingTopics = topicStats.filter(t => t.recentTrend === 'improving').length;
    const decliningTopics = topicStats.filter(t => t.recentTrend === 'declining').length;

    let overallRecommendation = '';
    if (avgMastery < 50) {
      overallRecommendation = 'Focus on strengthening foundational concepts. Consistent practice with weak areas will improve your mastery.';
    } else if (avgMastery < 70) {
      overallRecommendation = 'You\'re making progress! Continue practicing weak areas and begin exploring advanced topics in your strong areas.';
    } else {
      overallRecommendation = 'Excellent progress! You have solid fundamentals. Challenge yourself with advanced topics and help strengthen areas where others struggle.';
    }

    const nextSteps = [];
    if (weakAreas.length > 0) {
      nextSteps.push(`Focus on improving: ${weakAreas.map(a => a.topic).join(', ')}`);
    }
    if (improvingTopics > decliningTopics) {
      nextSteps.push('Maintain momentum by practicing regularly');
    } else {
      nextSteps.push('Address declining performance by revisiting recent quizzes');
    }
    nextSteps.push(`Complete ${Math.max(3, 7 - attempts.length)} more quizzes to get more accurate recommendations`);

    return {
      userId,
      generatedAt: new Date(),
      type: 'personalized_path',
      message: 'Your personalized learning roadmap based on your quiz history and mastery levels.',
      weeklyTopics,
      statistics: {
        totalQuizzesTaken: attempts.length,
        averageMastery: avgMastery,
        topicsStudied: topicStats.length,
        improvingTopics,
        decliningTopics,
        strongestArea: strongAreas.length > 0 ? `${strongAreas[strongAreas.length - 1].topic} (${strongAreas[strongAreas.length - 1].mastery}%)` : 'N/A',
        weakestArea: weakAreas.length > 0 ? `${weakAreas[0].topic} (${weakAreas[0].mastery}%)` : 'N/A'
      },
      overallRecommendation,
      nextSteps,
      topicDetails: topicStats
    };
  } catch (err) {
    console.error('Error generating learning path:', err);
    throw err;
  }
}

module.exports = {
  generateLearningPath,
  calculateTopicMastery,
  identifyAreasOfFocus
};
