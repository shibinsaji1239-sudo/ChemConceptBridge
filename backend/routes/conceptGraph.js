const express = require('express');
const ConceptGraph = require('../models/ConceptGraph');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/concept-graph
 * Fetch the entire concept dependency graph
 */
router.get('/', auth, async (req, res) => {
  try {
    let graphData = await ConceptGraph.find({});
    
    // Auto-seed if empty
    if (graphData.length === 0) {
      console.log('ConceptGraph is empty, performing auto-seed...');
      const Concept = require('../models/Concept');
      const concepts = await Concept.find({}).populate('prerequisites');

      for (const concept of concepts) {
        if (!concept.topic && !concept.title) continue;
        const topic = concept.topic || concept.title;
        const prerequisites = (concept.prerequisites || []).map(p => ({
          concept: p.topic || p.title,
          weight: 0.4
        }));

        if (prerequisites.length > 0) {
          await ConceptGraph.findOneAndUpdate(
            { concept: topic },
            { 
              concept: topic,
              $addToSet: { prerequisites: { $each: prerequisites } }
            },
            { upsert: true, new: true }
          );
        }
      }
      graphData = await ConceptGraph.find({});
    }

    // Format for react-force-graph
    const nodes = [];
    const links = [];
    const nodeSet = new Set();

    graphData.forEach(item => {
      if (!nodeSet.has(item.concept)) {
        nodes.push({ id: item.concept, name: item.concept, val: 1 });
        nodeSet.add(item.concept);
      }

      (item.prerequisites || []).forEach(pre => {
        if (!nodeSet.has(pre.concept)) {
          nodes.push({ id: pre.concept, name: pre.concept, val: 1 });
          nodeSet.add(pre.concept);
        }
        links.push({
          source: pre.concept,
          target: item.concept,
          weight: pre.weight,
          label: `Weight: ${pre.weight.toFixed(2)}`
        });
      });
    });

    res.json({ nodes, links });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/concept-graph/seed
 * Seed initial data from existing Concept model (Admin only)
 */
router.post('/seed', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const Concept = require('../models/Concept');
    const concepts = await Concept.find({}).populate('prerequisites');

    for (const concept of concepts) {
      const prerequisites = (concept.prerequisites || []).map(p => ({
        concept: p.topic || p.title,
        weight: 0.5
      }));

      await ConceptGraph.findOneAndUpdate(
        { concept: concept.topic || concept.title },
        { 
          concept: concept.topic || concept.title,
          $addToSet: { prerequisites: { $each: prerequisites } }
        },
        { upsert: true, new: true }
      );
    }

    res.json({ message: 'Graph seeded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
