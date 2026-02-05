const ConceptDependency = require('../models/ConceptDependency');
const Concept = require('../models/Concept');
const QuizAttempt = require('../models/QuizAttempt');

function assertCanAccessUser(req, userId) {
  if (!req.user) return false;
  if (req.user.role === 'admin' || req.user.role === 'teacher') return true;
  return req.user.role === 'student' && req.user._id?.toString() === userId?.toString();
}

async function buildGraphObject() {
  const concepts = await Concept.find({ status: 'approved', isActive: true }).select(
    '_id title topic difficulty prerequisites'
  );
  const dependencies = await ConceptDependency.find({ verified: true }).select(
    'sourceConcept targetConcept dependencyType dependencyWeight riskScore historicalFailureRate confidence'
  );

  const nodes = concepts.map((c) => ({
    id: c._id.toString(),
    title: c.title,
    topic: c.topic,
    difficulty: c.difficulty
  }));

  const edges = [];
  const outgoing = {};
  const incoming = {};

  const addEdge = (edge) => {
    edges.push(edge);
    if (!outgoing[edge.source]) outgoing[edge.source] = [];
    if (!incoming[edge.target]) incoming[edge.target] = [];
    outgoing[edge.source].push(edge.target);
    incoming[edge.target].push(edge.source);
  };

  // Prerequisite edges from Concept model
  for (const concept of concepts) {
    for (const prereq of concept.prerequisites || []) {
      addEdge({
        source: prereq.toString(),
        target: concept._id.toString(),
        type: 'prerequisite',
        weight: 1.0
      });
    }
  }

  // Additional (verified) edges from ConceptDependency model
  for (const dep of dependencies) {
    addEdge({
      source: dep.sourceConcept.toString(),
      target: dep.targetConcept.toString(),
      type: dep.dependencyType,
      weight: dep.dependencyWeight,
      riskScore: dep.riskScore,
      historicalFailureRate: dep.historicalFailureRate,
      confidence: dep.confidence
    });
  }

  return { nodes, edges, outgoing, incoming };
}

async function computeTopicMasteryMap(userId) {
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
 * Get risk analysis for all concepts
 */
exports.getRiskAnalysis = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!assertCanAccessUser(req, userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const concepts = await Concept.find({ status: 'approved', isActive: true });
    const graph = await buildGraphObject();
    const masteryMap = await computeTopicMasteryMap(userId);
    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));

    const riskAnalysis = concepts
      .map((concept) => {
        const conceptId = concept._id.toString();
        const incoming = graph.edges.filter((e) => e.target === conceptId);
        const risks = incoming
          .map((dep) => {
            const source = nodeById.get(dep.source);
            if (!source) return null;
            const mastery = masteryMap[source.topic] ?? 0.5;
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
      totalConcepts: concepts.length,
      riskAnalysis: riskAnalysis,
      highRiskConcepts: riskAnalysis.filter(r => r.riskLevel === 'high').length
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get risk analysis', error: err.message });
  }
};

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
