/**
 * SuperMemo SM-2 Algorithm Implementation
 * 
 * @param {number} quality - Review quality from 0 (forgot) to 5 (perfect)
 * @param {number} repetitions - Total successful repetitions
 * @param {number} previousInterval - Previous interval in days
 * @param {number} previousEaseFactor - Previous ease factor
 * 
 * @returns {object} { interval, repetitions, easeFactor }
 */
exports.calculateSM2 = (quality, repetitions, previousInterval, previousEaseFactor) => {
  let interval;
  let easeFactor = previousEaseFactor;
  let newRepetitions = repetitions;

  if (quality >= 3) {
    // Correct response
    if (newRepetitions === 0) {
      interval = 1;
    } else if (newRepetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(previousInterval * previousEaseFactor);
    }
    newRepetitions++;
  } else {
    // Incorrect response
    newRepetitions = 0;
    interval = 1;
  }

  // Calculate new Ease Factor (EF')
  // EF' = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  easeFactor = previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // EF cannot be less than 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  return {
    interval,
    repetitions: newRepetitions,
    easeFactor
  };
};
