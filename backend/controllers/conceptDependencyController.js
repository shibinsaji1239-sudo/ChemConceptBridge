const ConceptDependency = require('../models/ConceptDependency');
const Concept = require('../models/Concept');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');

function assertCanAccessUser(req, userId) {
  if (!req.user) return false;
  if (req.user.role === 'admin' || req.user.role === 'teacher') return true;
  return req.user.role === 'student' && req.user._id?.toString() === userId?.toString();
}

async function buildGraphObject() {
  try {
    // Use all concepts (not just approved) so the risk analyzer works
    // out-of-the-box in development and small deployments.
    const concepts = await Concept.find({}).select(
      '_id title topic difficulty prerequisites'
    );
    const dependencies = await ConceptDependency.find({ verified: true }).select(
      'sourceConcept targetConcept dependencyType dependencyWeight riskScore historicalFailureRate confidence'
    );

    if (!concepts) return { nodes: [], edges: [], outgoing: {}, incoming: {} };

    const nodes = concepts.map((c) => ({
      id: c._id ? c._id.toString() : 'unknown',
      title: c.title || 'Untitled',
      topic: c.topic || 'General',
      difficulty: c.difficulty || 'Beginner'
    }));

    const edges = [];
    const outgoing = {};
    const incoming = {};

    const addEdge = (edge) => {
      if (!edge.source || !edge.target) return;
      edges.push(edge);
      if (!outgoing[edge.source]) outgoing[edge.source] = [];
      if (!incoming[edge.target]) incoming[edge.target] = [];
      outgoing[edge.source].push(edge.target);
      incoming[edge.target].push(edge.source);
    };

    // Prerequisite edges from Concept model
    for (const concept of concepts) {
      if (!concept || !concept._id || !concept.prerequisites) continue;
      for (const prereq of concept.prerequisites) {
        if (!prereq) continue;
        try {
          addEdge({
            source: prereq.toString(),
            target: concept._id.toString(),
            type: 'prerequisite',
            weight: 1.0
          });
        } catch (err) {
          console.warn(`Error adding prerequisite edge for concept ${concept._id}: ${err.message}`);
        }
      }
    }

    // Additional (verified) edges from ConceptDependency model
    for (const dep of dependencies) {
      if (!dep || !dep.sourceConcept || !dep.targetConcept) continue;
      try {
        addEdge({
          source: dep.sourceConcept.toString(),
          target: dep.targetConcept.toString(),
          type: dep.dependencyType || 'prerequisite',
          weight: dep.dependencyWeight || 1.0,
          riskScore: dep.riskScore || 0.5,
          historicalFailureRate: dep.historicalFailureRate || 0,
          confidence: dep.confidence || 0.5
        });
      } catch (err) {
        console.warn(`Error adding verified edge: ${err.message}`);
      }
    }

    return { nodes, edges, outgoing, incoming };
  } catch (error) {
    console.error('Error in buildGraphObject:', error);
    return { nodes: [], edges: [], outgoing: {}, incoming: {} };
  }
}

async function computeTopicMasteryMap(userId) {
  try {
    const mongoose = require('mongoose');
    // Guard against invalid or special sentinel IDs (e.g. "class") to avoid
    // Mongoose CastError when querying QuizAttempt.student, which is an ObjectId.
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.warn(`Skipping topic mastery computation for invalid userId: ${userId}`);
      return {};
    }

    const attempts = await QuizAttempt.find({ student: userId }).populate('quiz', 'topic');
    const byTopic = new Map(); // topic -> {sum,count}

    for (const a of attempts) {
      const topic = a?.quiz?.topic;
      if (!topic) continue;
      const score = typeof a.score === 'number' ? a.score : 0;
      const prev = byTopic.get(topic) || { sum: 0, count: 0 };
      prev.sum += score;
      prev.count += 1;
      byTopic.set(topic, prev);
    }

    const mastery = {};
    for (const [topic, { sum, count }] of byTopic.entries()) {
      mastery[topic] = Math.max(0, Math.min(1, (sum / Math.max(1, count)) / 100));
    }

    return mastery;
  } catch (error) {
    console.error(`Error computing topic mastery for user ${userId}:`, error);
    return {}; // fallback to empty map on error
  }
}

/**
 * Build knowledge graph from concepts and dependencies
 */
exports.buildKnowledgeGraph = async (req, res) => {
  try {
    const graph = await buildGraphObject();
    res.json(graph);
  } catch (err) {
    res.status(500).json({ message: 'Failed to build knowledge graph', error: err.message });
  }
};

/**
 * Predict risk for a student based on their concept mastery
 */
exports.predictRisk = async (req, res) => {
  try {
    const { userId } = req.params;
    const { targetConceptId } = req.query;

    if (userId === 'class' || userId === 'entire-class') {
      return res.status(400).json({ message: 'Individual concept risk prediction not available for class view' });
    }

    const mongoose = require('mongoose');
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid student ID provided' });
    }

    if (!assertCanAccessUser(req, userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get student's mastery levels from quiz attempts
    const masteryMap = await computeTopicMasteryMap(userId);
    const graph = await buildGraphObject();

    // Get target concept
    const targetConcept = await Concept.findById(targetConceptId);
    if (!targetConcept) {
      return res.status(404).json({ message: 'Target concept not found' });
    }

    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));

    // Only evaluate direct incoming dependencies to target (clear A -> B story)
    const incoming = graph.edges.filter((e) => e.target === targetConceptId);

    const risks = incoming
      .map((dep) => {
        const source = nodeById.get(dep.source);
        if (!source) return null;
        const mastery = masteryMap[source.topic] ?? 0.5; // default unknown mastery
        const weakness = 1 - mastery;
        const depRisk = dep.riskScore ?? 0.6; // default moderate
        const riskScore = Math.max(0, Math.min(1, dep.weight * weakness * depRisk));
        const riskLevel = riskScore < 0.3 ? 'low' : riskScore < 0.6 ? 'medium' : 'high';

        return {
          sourceConcept: { id: source.id, title: source.title, topic: source.topic },
          targetConcept: { id: targetConceptId, title: targetConcept.title, topic: targetConcept.topic },
          dependencyType: dep.type,
          dependencyWeight: dep.weight,
          sourceMastery: mastery,
          riskScore,
          riskLevel,
          explanation: `If weak in ${source.title} (${Math.round(mastery * 100)}% mastery) → risk in ${targetConcept.title} is ${Math.round(riskScore * 100)}%`
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.riskScore - a.riskScore);

    // Sort by risk score
    res.json({
      targetConcept: {
        id: targetConcept._id,
        title: targetConcept.title,
        topic: targetConcept.topic
      },
      risks: risks,
      overallRisk: risks.length > 0 ? risks[0].riskScore : 0,
      recommendations: generateRecommendations(risks)
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to predict risk', error: err.message });
  }
};

/**
 * Get risk analysis for all concepts (individual or class-wide)
 */
exports.getRiskAnalysis = async (req, res) => {
  try {
    const { userId } = req.params;
    const isClassView = userId === 'class' || userId === 'entire-class';
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Authorization check
    if (isClassView) {
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Class view requires teacher or admin role' });
      }
    } else {
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(userId)) {
         return res.status(400).json({ message: 'Invalid student ID format' });
      }
      if (!assertCanAccessUser(req, userId)) {
        return res.status(403).json({ message: 'Access denied: You cannot view this user\'s risk analysis' });
      }
    }

    // Consider all concepts when computing risk, not only "approved",
    // so that teacher-created content immediately participates in the graph.
    const concepts = await Concept.find({});
    if (!concepts || concepts.length === 0) {
      return res.json({
        studentId: userId,
        isClassView,
        totalConcepts: 0,
        riskAnalysis: [],
        highRiskConcepts: 0,
        message: 'No active concepts found in the curriculum'
      });
    }
    const graph = await buildGraphObject();
    
    let masteryMap = {};
    if (isClassView) {
      const teacherId = req.user._id || req.user.id;
      const query = req.user.role === 'teacher' ? { assignedTeacher: teacherId, role: 'student' } : { role: 'student' };
      let students = await User.find(query).select('_id');
      
      // Fallback: if no students assigned to teacher, use all students for development visibility
      if (students.length === 0 && req.user.role === 'teacher') {
        students = await User.find({ role: 'student' }).select('_id');
      }

      const studentIds = students.map(s => s._id).filter(id => id && id.toString() !== 'class');
      
      if (studentIds.length > 0) {
        masteryMap = await computeClassTopicMasteryMap(studentIds);
      }
    } else {
      masteryMap = await computeTopicMasteryMap(userId);
    }

    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));

    const riskAnalysis = concepts
      .map((concept) => {
        const conceptId = concept._id.toString();
        const incoming = (graph.edges || []).filter((e) => e.target === conceptId);
        const risks = incoming
          .map((dep) => {
            const source = nodeById.get(dep.source);
            if (!source) return null;
            const mastery = (masteryMap && masteryMap[source.topic]) ?? 0.5;
            const weakness = 1 - mastery;
            const depRisk = dep.riskScore ?? 0.6;
            const score = Math.max(0, Math.min(1, dep.weight * weakness * depRisk));
            return { score, sourceMastery: mastery };
          })
          .filter(Boolean);

        const overallRisk = risks.length ? Math.max(...risks.map((r) => r.score)) : 0;
        const criticalDependencies = risks.filter((r) => r.score >= 0.6).length;

        return {
          concept: { id: conceptId, title: concept.title, topic: concept.topic },
          overallRisk,
          riskLevel: overallRisk < 0.3 ? 'low' : overallRisk < 0.6 ? 'medium' : 'high',
          criticalDependencies
        };
      })
      .sort((a, b) => b.overallRisk - a.overallRisk);

    res.json({
      studentId: userId,
      isClassView,
      totalConcepts: concepts.length,
      riskAnalysis: riskAnalysis,
      highRiskConcepts: riskAnalysis.filter(r => r.riskLevel === 'high').length
    });
  } catch (err) {
    // Gracefully handle CastError on QuizAttempt.student (e.g. if a sentinel
    // value like "class" accidentally flows into a student filter somewhere).
    if (err?.name === 'CastError' && err?.path === 'student') {
      console.warn('CastError on QuizAttempt.student in getRiskAnalysis, returning empty analysis.');
      return res.json({
        studentId: req.params.userId,
        isClassView: req.params.userId === 'class' || req.params.userId === 'entire-class',
        totalConcepts: 0,
        riskAnalysis: [],
        highRiskConcepts: 0,
        message: 'No risk data available yet for this selection.'
      });
    }

    console.error('Error in getRiskAnalysis:', err);
    res.status(500).json({ 
      message: 'Failed to get risk analysis', 
      error: err.message,
      stack: err.stack
    });
  }
};

async function computeClassTopicMasteryMap(studentIds) {
  try {
    if (!studentIds || studentIds.length === 0) return {};
    const attempts = await QuizAttempt.find({ student: { $in: studentIds } }).populate('quiz', 'topic');
    const byTopic = new Map(); // topic -> {sum,count}

    for (const a of attempts) {
      const topic = a?.quiz?.topic;
      if (!topic) continue;
      const score = typeof a.score === 'number' ? a.score : 0;
      const prev = byTopic.get(topic) || { sum: 0, count: 0 };
      prev.sum += score;
      prev.count += 1;
      byTopic.set(topic, prev);
    }

    const mastery = {};
    for (const [topic, { sum, count }] of byTopic.entries()) {
      mastery[topic] = Math.max(0, Math.min(1, (sum / Math.max(1, count)) / 100));
    }

    return mastery;
  } catch (error) {
    console.error('Error computing class topic mastery:', error);
    return {}; // fallback
  }
}

/**
 * Generate recommendations based on risk analysis
 */
function generateRecommendations(risks) {
  const recommendations = [];

  if (risks.length === 0) {
    return ['No significant risks identified. Continue with current learning path.'];
  }

  const highRisks = risks.filter(r => r.riskLevel === 'high');
  if (highRisks.length > 0) {
    recommendations.push(`⚠️ Critical: Master these ${highRisks.length} prerequisite concepts first:`);
    highRisks.slice(0, 3).forEach(risk => {
      recommendations.push(`  • ${risk.sourceConcept.title} (current mastery: ${(risk.sourceMastery * 100).toFixed(0)}%)`);
    });
  }

  const mediumRisks = risks.filter(r => r.riskLevel === 'medium');
  if (mediumRisks.length > 0) {
    recommendations.push(`📚 Review these ${mediumRisks.length} related concepts before proceeding.`);
  }

  recommendations.push('💡 Tip: Focus on building strong foundations before moving to advanced topics.');

  return recommendations;
}

/**
 * Update dependency weights based on historical performance
 */
exports.updateDependencyWeights = async (req, res) => {
  try {
    // Analyze quiz attempts to update dependency weights
    const attempts = await QuizAttempt.find().populate('quiz');

    // Group by concept pairs
    const conceptPairs = {};

    for (const attempt of attempts) {
      if (!attempt.quiz || !attempt.quiz.topic) continue;

      const topic = attempt.quiz.topic;
      const score = attempt.score || 0;

      // Find related concepts from prerequisites
      const concept = await Concept.findOne({ topic });
      if (concept && concept.prerequisites) {
        for (const prereqId of concept.prerequisites) {
          const prereq = await Concept.findById(prereqId);
          if (!prereq) continue;

          const key = `${prereq.topic}_${topic}`;
          if (!conceptPairs[key]) {
            conceptPairs[key] = { total: 0, failed: 0, sourceConcept: prereqId, targetConcept: concept._id };
          }
          conceptPairs[key].total += 1;
          if (score < 60) {
            conceptPairs[key].failed += 1;
          }
        }
      }
    }

    // Update ConceptDependency records
    for (const [key, data] of Object.entries(conceptPairs)) {
      const failureRate = data.failed / data.total;

      await ConceptDependency.findOneAndUpdate(
        { sourceConcept: data.sourceConcept, targetConcept: data.targetConcept },
        {
          sourceConcept: data.sourceConcept,
          targetConcept: data.targetConcept,
          historicalFailureRate: failureRate,
          dependencyWeight: failureRate > 0.5 ? 0.9 : failureRate > 0.3 ? 0.7 : 0.5,
          riskScore: failureRate
        },
        { upsert: true, new: true }
      );
    }

    res.json({
      message: 'Dependency weights updated',
      pairsAnalyzed: Object.keys(conceptPairs).length
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update dependency weights', error: err.message });
  }
};
