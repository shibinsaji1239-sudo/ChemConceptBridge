const express = require('express');
const QuizAttempt = require('../models/QuizAttempt');
const Concept = require('../models/Concept');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Enhanced rules mapping for common chemistry misconceptions to remediation content
const RULES = [
  // Acid-Base Misconceptions
  {
    category: 'acid-base',
    patterns: [
      /naoh\s*is\s*an\s*acid|naoh.*acid|sodium\s*hydroxide.*acid/i,
      /koh\s*is\s*an\s*acid|potassium\s*hydroxide.*acid/i,
      /ca\(oh\)2\s*is\s*an\s*acid|calcium\s*hydroxide.*acid/i
    ],
    misconception: 'Confusing strong bases with acids',
    whyWrong: 'Strong bases like NaOH/KOH produce OH⁻ in water, so calling them acids is incorrect.',
    correctUnderstanding: 'Acids donate H⁺ (or increase H₃O⁺), bases accept H⁺ / produce OH⁻. Identify ions in water.',
    example: 'NaOH → Na⁺ + OH⁻ (base); HCl → H⁺ + Cl⁻ (acid).',
    severity: 'high',
    resources: [
      { type: 'video', title: 'Acids vs Bases Basics', url: 'https://www.youtube.com/watch?v=KZ8qf4m5YwI' },
      { type: 'article', title: 'Strong Bases: Why NaOH is Basic', url: 'https://chem.libretexts.org/Bookshelves/General_Chemistry' },
      { type: 'interactive', title: 'Acid-Base Classification Game', url: 'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_en.html' }
    ]
  },
  {
    category: 'acid-base',
    patterns: [
      /ph\s*scale.*confusion|ph.*basic.*acidic|ph.*neutral/i,
      /ph\s*below\s*7.*base|ph\s*above\s*7.*acid/i
    ],
    misconception: 'Misunderstanding pH scale direction',
    whyWrong: 'pH < 7 indicates acidic solutions (more H₃O⁺), while pH > 7 indicates basic solutions (more OH⁻).',
    correctUnderstanding: 'Lower pH = more acidic; higher pH = more basic; pH 7 is neutral at 25°C.',
    example: 'pH 2 (acidic) vs pH 12 (basic).',
    severity: 'medium',
    resources: [
      { type: 'animation', title: 'pH Scale Interactive', url: 'https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_en.html' },
      { type: 'video', title: 'Understanding pH Scale', url: 'https://www.youtube.com/watch?v=2S6e11NBwiw' }
    ]
  },
  // Periodic Table Misconceptions
  {
    category: 'periodic-table',
    patterns: [
      /all\s*metals.*conduct|metals.*always.*conduct/i,
      /noble\s*gases.*reactive|helium.*reactive/i,
      /group\s*1.*alkaline\s*earth|alkali\s*metals.*group\s*2/i
    ],
    misconception: 'Confusing metal properties and periodic groups',
    whyWrong: 'Periodic groups have specific names/properties; mixing groups leads to wrong reactivity and trends.',
    correctUnderstanding: 'Group 1 = alkali metals, Group 2 = alkaline earth metals; noble gases are largely inert.',
    example: 'Na is Group 1 (alkali); Mg is Group 2 (alkaline earth).',
    severity: 'medium',
    resources: [
      { type: 'interactive', title: 'Periodic Table Explorer', url: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_en.html' },
      { type: 'video', title: 'Understanding Metal Properties', url: 'https://www.youtube.com/watch?v=0RRVV4Diomg' }
    ]
  },
  // Chemical Bonding Misconceptions
  {
    category: 'bonding',
    patterns: [
      /ionic\s*bonds.*share|covalent\s*bonds.*transfer/i,
      /single\s*bond.*stronger.*double|double\s*bond.*weaker/i,
      /metallic\s*bonding.*covalent/i
    ],
    misconception: 'Confusing different types of chemical bonds',
    whyWrong: 'Ionic bonding involves electron transfer (usually metal + nonmetal), covalent involves sharing (nonmetals).',
    correctUnderstanding: 'Use electronegativity/particle types: transfer → ionic; sharing → covalent; metals in lattice → metallic.',
    example: 'NaCl (ionic) vs H₂O (covalent) vs Cu (metallic).',
    severity: 'high',
    resources: [
      { type: 'animation', title: 'Chemical Bonding Types', url: 'https://phet.colorado.edu/sims/html/molecule-polarity/latest/molecule-polarity_en.html' },
      { type: 'video', title: 'Types of Chemical Bonds', url: 'https://www.youtube.com/watch?v=QXT4OVM4vXI' }
    ]
  },
  // Stoichiometry Misconceptions
  {
    category: 'stoichiometry',
    patterns: [
      /moles.*mass.*same|molar\s*mass.*moles/i,
      /limiting\s*reagent.*excess|excess.*limiting/i,
      /mole\s*ratio.*mass\s*ratio/i
    ],
    misconception: 'Confusing moles, mass, and ratios in stoichiometry',
    whyWrong: 'Moles count particles; mass depends on molar mass. Ratios in equations are mole ratios, not mass ratios.',
    correctUnderstanding: 'Convert mass ↔ moles using molar mass, then apply coefficients as mole ratios.',
    example: '2H₂ + O₂ → 2H₂O means 2 mol H₂ reacts with 1 mol O₂.',
    severity: 'high',
    resources: [
      { type: 'calculator', title: 'Stoichiometry Calculator', url: '/chemistry-calculator' },
      { type: 'video', title: 'Mole Calculations Made Easy', url: 'https://www.youtube.com/watch?v=9T7Ugct6VsY' }
    ]
  },
  // Thermodynamics Misconceptions
  {
    category: 'thermodynamics',
    patterns: [
      /exothermic.*heat.*absorbed|endothermic.*heat.*released/i,
      /entropy.*disorder.*decrease|entropy.*order.*increase/i,
      /gibbs\s*free\s*energy.*spontaneous.*positive/i
    ],
    misconception: 'Confusing thermodynamic concepts and energy changes',
    whyWrong: 'Exothermic releases heat; endothermic absorbs heat. Swapping them reverses sign conventions.',
    correctUnderstanding: 'Exothermic: ΔH < 0; Endothermic: ΔH > 0. Check energy flow direction.',
    example: 'Combustion (exothermic) vs melting ice (endothermic).',
    severity: 'medium',
    resources: [
      { type: 'simulation', title: 'Thermodynamics Simulator', url: 'https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_en.html' },
      { type: 'video', title: 'Understanding Energy Changes', url: 'https://www.youtube.com/watch?v=5Y2X1jRAon0' }
    ]
  },
  // Atomic Structure Misconceptions
  {
    category: 'atomic-structure',
    patterns: [
      /electrons.*nucleus|protons.*orbiting/i,
      /neutrons.*charge|electrons.*positive|protons.*negative/i,
      /mass\s*number.*atomic\s*number.*same/i
    ],
    misconception: 'Misunderstanding atomic subatomic particles and their positions',
    whyWrong: 'Protons/neutrons are in the nucleus; electrons occupy orbitals around it. Charges are fixed per particle type.',
    correctUnderstanding: 'Proton: +1 (nucleus), neutron: 0 (nucleus), electron: −1 (orbitals).',
    example: 'Atomic number = protons; mass number = protons + neutrons.',
    severity: 'high',
    resources: [
      { type: 'interactive', title: 'Build an Atom', url: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_en.html' },
      { type: 'video', title: 'Atomic Structure Explained', url: 'https://www.youtube.com/watch?v=lP57gEWcisY' }
    ]
  },
  // Chemical Equilibrium Misconceptions
  {
    category: 'equilibrium',
    patterns: [
      /equilibrium.*static|reaction.*stops.*equilibrium/i,
      /concentration.*equal.*equilibrium/i,
      /catalyst.*shifts.*equilibrium/i
    ],
    misconception: 'Misunderstanding the dynamic nature of chemical equilibrium',
    whyWrong: 'At equilibrium, forward and reverse reactions continue; rates are equal, not concentrations necessarily.',
    correctUnderstanding: 'Dynamic equilibrium: rates equal; the system continues reacting microscopically.',
    example: 'N₂O₄ ⇌ 2NO₂ continues both ways at equilibrium.',
    severity: 'high',
    resources: [
      { type: 'animation', title: 'Reversible Reactions', url: 'https://phet.colorado.edu/sims/html/reversible-reactions/latest/reversible-reactions_en.html' },
      { type: 'video', title: 'Dynamic Equilibrium Basics', url: 'https://www.youtube.com/watch?v=wlD_ImYQAgQ' }
    ]
  },
  // Solubility Misconceptions
  {
    category: 'solubility',
    patterns: [
      /saturated.*cannot\s*dissolve.*more|supersaturated.*stable/i,
      /solubility.*increases.*temp.*always/i,
      /dissolving.*chemical\s*change/i
    ],
    misconception: 'Confusing physical dissolution with chemical reactions or saturation states',
    whyWrong: 'Dissolving is usually a physical process; saturation refers to equilibrium of dissolution, not “no more can ever dissolve”.',
    correctUnderstanding: 'Saturated = at solubility limit (dynamic), supersaturated = unstable, dissolution ≠ chemical change.',
    example: 'NaCl dissolving in water is physical; burning Mg is chemical.',
    severity: 'medium',
    resources: [
      { type: 'simulation', title: 'Salts and Solubility', url: 'https://phet.colorado.edu/sims/html/salts-and-solubility/latest/salts-and-solubility_en.html' },
      { type: 'video', title: 'Solubility and Saturation', url: 'https://www.youtube.com/watch?v=OpW_93uToi0' }
    ]
  }
];

// Enhanced misconception detection function
function detectMisconceptions(userInput, questionContext = '') {
  const detectedMisconceptions = [];
  const inputText = (userInput + ' ' + questionContext).toLowerCase();
  
  RULES.forEach(rule => {
    rule.patterns.forEach(pattern => {
      if (pattern.test(inputText)) {
        detectedMisconceptions.push({
          category: rule.category,
          misconception: rule.misconception,
          severity: rule.severity,
          confidence: calculateConfidence(inputText, pattern),
          timestamp: new Date()
        });
      }
    });
  });
  
  return detectedMisconceptions;
}

// Calculate confidence score based on pattern match strength
function calculateConfidence(text, pattern) {
  const matches = text.match(pattern);
  if (!matches) return 0;
  
  // Higher confidence for exact matches and multiple keyword matches
  let confidence = 0.5;
  if (matches[0].length > 10) confidence += 0.2;
  if (text.split(' ').length > 5) confidence += 0.1;
  if (matches.length > 1) confidence += 0.2;
  
  return Math.min(confidence, 1.0);
}

function enrichMisconception(detected) {
  // Find the first matching rule for richer explanations
  const rule = RULES.find((r) => r.category === detected.category && r.misconception === detected.misconception);
  if (!rule) {
    return {
      ...detected,
      whyWrong: 'This answer reflects a common misunderstanding of the underlying chemistry concept.',
      correctUnderstanding: 'Review the core definition and apply it to distinguish the correct concept.',
      example: 'Re-check the definition, then test it on a simple example case.'
    };
  }

  return {
    ...detected,
    whyWrong:
      rule.whyWrong ||
      'This misconception mixes up definitions or applies a rule in the wrong context.',
    correctUnderstanding:
      rule.correctUnderstanding ||
      'Use the correct definition/rule and check the conditions where it applies.',
    example: rule.example || ''
  };
}

// Per-question misconception analysis for an attempt:
// Detects misconceptions from the student's chosen option text + question context,
// and returns a detailed explanation aligned to that specific question.
router.get('/attempt/:attemptId/misconceptions', auth, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt = await QuizAttempt.findById(attemptId).populate('quiz');
    if (!attempt || attempt.student.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    const quiz = attempt.quiz;
    if (!quiz) {
      return res.status(200).json({
        quiz: { id: attempt.quiz, title: 'Unknown Quiz', topic: '' },
        attemptId,
        totalQuestions: 0,
        incorrectCount: 0,
        analyses: []
      });
    }

    const analyses = (attempt.answers || []).map((a) => {
      const q = Array.isArray(quiz.questions)
        ? quiz.questions.find((qq) => String(qq._id) === String(a.questionId))
        : null;

      const options = q?.options || [];
      const selectedIndex = typeof a.selectedOption === 'number' ? a.selectedOption : null;
      const correctIndex = typeof q?.correct === 'number' ? q.correct : null;

      const userAnswerText =
        selectedIndex != null && options[selectedIndex] != null ? String(options[selectedIndex]) : '';
      const correctText =
        correctIndex != null && options[correctIndex] != null ? String(options[correctIndex]) : '';

      const context = q?.question || quiz.topic || '';
      const detected = detectMisconceptions(userAnswerText, context).map(enrichMisconception);

      return {
        questionId: String(a.questionId),
        topic: quiz.topic || '',
        question: q?.question || '',
        options,
        selectedIndex,
        userAnswer: userAnswerText,
        correctIndex,
        correctText,
        isCorrect: !!a.isCorrect,
        explanation: q?.explanation || '',
        misconceptions: detected,
      };
    });

    res.json({
      quiz: { id: quiz._id, title: quiz.title, topic: quiz.topic },
      attemptId,
      totalQuestions: analyses.length,
      incorrectCount: analyses.filter((x) => !x.isCorrect).length,
      analyses,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recommend', auth, async (req, res) => {
  try {
    const { attemptId } = req.body || {};
    if (!attemptId) return res.status(400).json({ message: 'attemptId is required' });

    // Populate quiz with full questions so we can access option text and question context
    const attempt = await QuizAttempt.findById(attemptId).populate('quiz');
    if (!attempt || attempt.student.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    const misconceptions = Array.isArray(attempt.misconceptions) ? attempt.misconceptions : [];
    const detectedMisconceptions = [];

    // Enhanced misconception detection from user answers
    attempt.answers.forEach(answer => {
      // Try to resolve the selected option text and question context for better detection
      let answerText = '';
      let context = attempt.quiz?.topic || '';
      try {
        const questionObj = (attempt.quiz && Array.isArray(attempt.quiz.questions))
          ? attempt.quiz.questions.find(q => String(q._id) === String(answer.questionId))
          : null;
        if (questionObj) {
          answerText = String(questionObj.options?.[answer.selectedOption] || '');
          context = questionObj.question || context;
        } else {
          answerText = String(answer.selectedOption || '');
        }
      } catch (e) {
        answerText = String(answer.selectedOption || '');
      }

      const detected = detectMisconceptions(answerText, context);
      // Debug log to help trace mapping of selected option -> detected misconceptions
      console.debug('[remediation] questionId=', String(answer.questionId), 'selectedIndex=', String(answer.selectedOption), 'answerText=', answerText, 'context=', context, 'detected=', detected.map(d=>d.misconception || d));
      detectedMisconceptions.push(...detected);
    });

  // Combine with existing misconceptions
  const allMisconceptions = [...misconceptions, ...detectedMisconceptions];

    // Rule-based recommendations with enhanced categorization
    const recs = [];
    allMisconceptions.forEach(m => {
      const text = String(typeof m === 'string' ? m : m.misconception || '').toLowerCase();
      RULES.forEach(rule => {
        const ruleText = String(rule.misconception || '').toLowerCase();
        const match = (ruleText === text) || text.includes(ruleText) || ruleText.includes(text);
        if (match) {
          rule.resources.forEach(r => recs.push({
            reason: typeof m === 'string' ? m : m.misconception,
            category: rule.category,
            severity: rule.severity,
            confidence: typeof m === 'object' ? m.confidence : 0.8,
            ...r
          }));
        }
      });
    });

    // Concept-based fallback: find concepts by topic
    if (attempt.quiz?.topic) {
      const concepts = await Concept.find({
        isActive: true,
        status: 'approved',
        $or: [
          { topic: { $regex: attempt.quiz.topic, $options: 'i' } },
          { tags: { $in: [attempt.quiz.topic] } }
        ]
      }).select('title content.visualizations content.interactiveElements');
      concepts.slice(0, 3).forEach(c => {
        (c.content?.visualizations || []).forEach(u => recs.push({ 
          type: 'visualization', 
          title: c.title, 
          url: u,
          category: 'general',
          severity: 'low'
        }));
        (c.content?.interactiveElements || []).forEach(u => recs.push({ 
          type: 'interactive', 
          title: c.title, 
          url: u,
          category: 'general',
          severity: 'low'
        }));
      });
    }

    if (recs.length === 0) {
      const text = ([attempt.quiz?.topic || '']
        .concat((attempt.quiz?.questions || []).map(q => q.question || ''))
        .concat(allMisconceptions.map(m => (typeof m === 'string' ? m : m.misconception) || ''))
        .join(' ').toLowerCase());

      const addRuleResources = (category) => {
        const rule = RULES.find(r => r.category === category);
        if (rule) {
          rule.resources.forEach(r => recs.push({
            reason: rule.misconception,
            category: rule.category,
            severity: rule.severity,
            confidence: 0.6,
            ...r
          }));
        }
      };

      if (/(naoh|koh|acid|base|ph)/.test(text)) addRuleResources('acid-base');
      else if (/(mole|moles|stoichiometry|limiting|reagent|mass)/.test(text)) addRuleResources('stoichiometry');
      else if (/(bond|ionic|covalent|metallic|polarity)/.test(text)) addRuleResources('bonding');
      else if (/(thermo|entropy|enthalpy|exothermic|endothermic|gibbs)/.test(text)) addRuleResources('thermodynamics');
      else if (/(periodic|group|alkali|alkaline|noble|metal)/.test(text)) addRuleResources('periodic-table');
    }

    if (recs.length === 0) {
      const topic = String(attempt.quiz?.topic || '').toLowerCase();
      const mapTopic = (t) => {
        if (/acid/.test(t) || /base/.test(t)) return 'acid-base';
        if (/stoich/.test(t)) return 'stoichiometry';
        if (/bond/.test(t)) return 'bonding';
        if (/thermo/.test(t)) return 'thermodynamics';
        if (/periodic/.test(t)) return 'periodic-table';
        return null;
      };
      const cat = mapTopic(topic);
      if (cat) {
        const rule = RULES.find(r => r.category === cat);
        if (rule) {
          rule.resources.forEach(r => recs.push({
            reason: rule.misconception,
            category: rule.category,
            severity: rule.severity,
            confidence: 0.5,
            ...r
          }));
        }
      }
    }

    // De-duplicate by url and sort by severity
    const seen = new Set();
    const unique = recs.filter(r => (r.url ? (seen.has(r.url) ? false : (seen.add(r.url), true)) : true));
    
    // Sort by severity (high -> medium -> low) and confidence
    const sorted = unique.sort((a, b) => {
      const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return (b.confidence || 0) - (a.confidence || 0);
    });

    // Update quiz attempt with detected misconceptions
    if (detectedMisconceptions.length > 0) {
      attempt.misconceptions = [...misconceptions, ...detectedMisconceptions.map(m => m.misconception)];
      await attempt.save();
    }

    res.json({ 
      recommendations: sorted.slice(0, 10),
      detectedMisconceptions: detectedMisconceptions.length,
      categories: [...new Set(sorted.map(r => r.category))],
      summary: {
        total: sorted.length,
        highSeverity: sorted.filter(r => r.severity === 'high').length,
        mediumSeverity: sorted.filter(r => r.severity === 'medium').length,
        lowSeverity: sorted.filter(r => r.severity === 'low').length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Real-time misconception detection endpoint
router.post('/detect-misconceptions', auth, async (req, res) => {
  try {
    const { userInput, context = '', questionId = null } = req.body;
    
    if (!userInput) {
      return res.status(400).json({ message: 'userInput is required' });
    }

    const detected = detectMisconceptions(userInput, context);
    
    // Store detection for analytics (optional)
    if (detected.length > 0 && questionId) {
      // Could store in a separate misconceptions collection for analytics
      console.log(`Misconception detected for user ${req.user.id}:`, detected);
    }

    res.json({
      misconceptions: detected,
      count: detected.length,
      categories: [...new Set(detected.map(m => m.category))],
      severity: detected.reduce((acc, m) => {
        acc[m.severity] = (acc[m.severity] || 0) + 1;
        return acc;
      }, {})
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics endpoint for misconception tracking
router.get('/analytics', auth, async (req, res) => {
  try {
    // Only admins and teachers can access analytics
    if (!['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { timeRange = '30d', category = 'all' } = req.query;
    
    // Get misconception data from quiz attempts
    const attempts = await QuizAttempt.find({
      completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      misconceptions: { $exists: true, $ne: [] }
    }).populate('quiz', 'topic');

    const analytics = {
      totalMisconceptions: 0,
      byCategory: {},
      bySeverity: {},
      byTopic: {},
      trends: [],
      topMisconceptions: []
    };

    // Process misconception data
    attempts.forEach(attempt => {
      const misconceptions = Array.isArray(attempt.misconceptions) ? attempt.misconceptions : [];
      misconceptions.forEach(misconception => {
        analytics.totalMisconceptions++;
        
        // Categorize misconceptions
        const detected = detectMisconceptions(misconception, attempt.quiz?.topic || '');
        detected.forEach(d => {
          analytics.byCategory[d.category] = (analytics.byCategory[d.category] || 0) + 1;
          analytics.bySeverity[d.severity] = (analytics.bySeverity[d.severity] || 0) + 1;
        });
        
        // Track by topic
        if (attempt.quiz?.topic) {
          analytics.byTopic[attempt.quiz.topic] = (analytics.byTopic[attempt.quiz.topic] || 0) + 1;
        }
      });
    });

    // Get top misconceptions
    const misconceptionCounts = {};
    attempts.forEach(attempt => {
      (attempt.misconceptions || []).forEach(m => {
        misconceptionCounts[m] = (misconceptionCounts[m] || 0) + 1;
      });
    });
    
    analytics.topMisconceptions = Object.entries(misconceptionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([misconception, count]) => ({ misconception, count }));

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


