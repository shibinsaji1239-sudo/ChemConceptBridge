const ConceptGraph = require('../models/ConceptGraph');

/**
 * Smart Concept Router
 * Identifies the most critical prerequisite concept for a student based on failure patterns.
 * 
 * @param {string} conceptTitle - The concept the student is struggling with
 * @returns {Promise<string|null>} - The recommended prerequisite concept title
 */
async function findMissingConcept(conceptTitle) {
  try {
    const node = await ConceptGraph.findOne({ concept: conceptTitle });
    
    if (!node || !node.prerequisites || node.prerequisites.length === 0) {
      return null;
    }

    // Sort by weight descending. Higher weight means higher dependency strength.
    // If a student fails a concept, we recommend the prerequisite with the strongest dependency.
    const sortedPrerequisites = node.prerequisites.sort((a, b) => b.weight - a.weight);

    return sortedPrerequisites[0].concept;
  } catch (error) {
    console.error('Error in findMissingConcept:', error);
    return null;
  }
}

/**
 * Updates the dependency weight between a concept and its prerequisite.
 * Called when a student makes a mistake.
 * 
 * @param {string} conceptTitle - The current concept
 * @param {string} prerequisiteTitle - The prerequisite concept suspected to be the cause
 */
async function updateConceptWeight(conceptTitle, prerequisiteTitle) {
  try {
    let node = await ConceptGraph.findOne({ concept: conceptTitle });
    
    if (!node) {
      // Create node if it doesn't exist
      node = new ConceptGraph({
        concept: conceptTitle,
        prerequisites: []
      });
    }

    let prerequisite = node.prerequisites.find(p => p.concept === prerequisiteTitle);
    
    if (prerequisite) {
      // Increase weight because a failure suggests the dependency is strong/relevant
      prerequisite.weight = Math.min(1.0, prerequisite.weight + 0.05);
    } else {
      // If it doesn't exist, add it
      node.prerequisites.push({ concept: prerequisiteTitle, weight: 0.2 });
    }
    
    await node.save();
  } catch (error) {
    console.error('Error updating concept weight:', error);
  }
}

/**
 * Decreases the dependency weight between a concept and its prerequisite.
 * Called when a student succeeds in a concept, suggesting they have mastered the prerequisites.
 * 
 * @param {string} conceptTitle - The current concept
 * @param {string} prerequisiteTitle - The prerequisite concept 
 */
async function reduceConceptWeight(conceptTitle, prerequisiteTitle) {
  try {
    let node = await ConceptGraph.findOne({ concept: conceptTitle });
    
    if (node) {
      let prerequisite = node.prerequisites.find(p => p.concept === prerequisiteTitle);
      
      if (prerequisite) {
        // Decrease weight because a success suggests the student has mastered the dependency
        prerequisite.weight = Math.max(0.1, prerequisite.weight - 0.05);
        await node.save();
      }
    }
  } catch (error) {
    console.error('Error reducing concept weight:', error);
  }
}

/**
 * Ensures a concept exists in the graph even if it has no prerequisites.
 * 
 * @param {string} conceptTitle 
 */
async function ensureConceptInGraph(conceptTitle) {
  try {
    await ConceptGraph.findOneAndUpdate(
      { concept: conceptTitle },
      { concept: conceptTitle },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error ensuring concept in graph:', error);
  }
}

module.exports = {
  findMissingConcept,
  updateConceptWeight,
  reduceConceptWeight,
  ensureConceptInGraph
};
