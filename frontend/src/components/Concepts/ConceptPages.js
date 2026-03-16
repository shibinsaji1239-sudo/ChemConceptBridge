import React, { useEffect, useMemo, useState } from 'react';
import './ConceptPages.css';
import api from '../../apiClient';
import AcidBaseConcept from './AcidBaseConcept';
import PeriodicTableConcept from './PeriodicTableConcept';
import BondingConcept from './BondingConcept';
import ThermodynamicsConcept from './ThermodynamicsConcept';
import TopicDiagram from './TopicDiagram';
import TopicConceptMap from './TopicConceptMap';

// Map concept topic names to rich content components
const topicToComponent = (topic = '') => {
  switch (topic.toLowerCase()) {
    case 'acids & bases':
      return AcidBaseConcept;
    case 'periodic table':
      return PeriodicTableConcept;
    case 'chemical bonding':
      return BondingConcept;
    case 'thermodynamics':
      return ThermodynamicsConcept;
    default:
      return null;
  }
};

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'Beginner': return '#16a34a';
    case 'Intermediate': return '#d97706';
    case 'Advanced': return '#dc2626';
    default: return '#64748b';
  }
};

// Topic-specific content mapping
const getTopicContent = (topic) => {
  const topicLower = (topic || '').toLowerCase();

  const contentMap = {
    'acids & bases': {
      image: 'https://images.unsplash.com/photo-1581093191175-e0bc33d8372d?q=80&w=400&auto=format&fit=crop',
      overview: 'Acids and bases are fundamental concepts in chemistry that help us understand chemical behavior in aqueous solutions. An acid is a substance that increases the concentration of hydrogen ions (H⁺) in aqueous solution, while a base increases the concentration of hydroxide ions (OH⁻).',
      keyPoints: [
        'Definitions of acids and bases (Arrhenius, Brønsted-Lowry, and Lewis models).',
        'Strength of acids and bases and their degree of ionization.',
        'The pH scale and its logarithmic nature.',
        'Neutralization reactions and formation of salts.',
        'Role of buffers in maintaining constant pH.'
      ],
      examples: [
        'Stomach acid, vinegar, and carbonated drinks as everyday acids.',
        'Soap, baking soda, and ammonia solution as common bases.',
        'Real-world applications such as water treatment and blood pH regulation.'
      ],
      diagram: 'Interactive molecular visualization of acid-base reactions'
    },
    'periodic table': {
      image: 'https://images.unsplash.com/photo-1532187875605-183881409d20?q=80&w=400&auto=format&fit=crop',
      overview: 'The periodic table is a systematic arrangement of chemical elements organized by their atomic number, electron configuration, and recurring chemical properties. Elements are arranged in rows (periods) and columns (groups) that reveal periodic trends.',
      keyPoints: [
        'Organization by atomic number and electron configuration.',
        'Periodic trends: atomic radius, ionization energy, electronegativity.',
        'Group characteristics: alkali metals, halogens, noble gases.',
        'Period characteristics: transition metals, metalloids, nonmetals.',
        'Predicting chemical behavior based on position in the table.'
      ],
      examples: [
        'Sodium (Na) and Potassium (K) in Group 1 - highly reactive alkali metals.',
        'Chlorine (Cl) and Fluorine (F) in Group 17 - reactive halogens.',
        'Helium (He) and Neon (Ne) in Group 18 - inert noble gases.'
      ],
      diagram: 'Interactive periodic table with element properties'
    },
    'chemical bonding': {
      image: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?q=80&w=400&auto=format&fit=crop',
      overview: 'Chemical bonding is the force that holds atoms together in molecules and compounds. The three main types of chemical bonds are ionic, covalent, and metallic bonds, each with distinct properties and formation mechanisms.',
      keyPoints: [
        'Ionic bonds: transfer of electrons between metals and nonmetals.',
        'Covalent bonds: sharing of electron pairs between atoms.',
        'Metallic bonds: delocalized electrons in metal lattices.',
        'Bond strength and energy calculations.',
        'Molecular geometry and VSEPR theory.'
      ],
      examples: [
        'Sodium chloride (NaCl) - ionic bond between Na⁺ and Cl⁻.',
        'Water (H₂O) - covalent bonds between hydrogen and oxygen.',
        'Copper wire - metallic bonding allowing electrical conductivity.'
      ],
      diagram: 'Interactive visualization of different bond types'
    },
    'thermodynamics': {
      image: 'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?q=80&w=400&auto=format&fit=crop',
      overview: 'Thermodynamics is the branch of chemistry that deals with energy changes in chemical reactions and physical processes. It helps us understand whether reactions occur spontaneously and how energy is transferred.',
      keyPoints: [
        'First law: conservation of energy (ΔU = Q - W).',
        'Second law: entropy and spontaneity (ΔG = ΔH - TΔS).',
        'Enthalpy (ΔH): heat changes in reactions.',
        'Entropy (ΔS): measure of disorder or randomness.',
        'Gibbs free energy (ΔG): predicting reaction spontaneity.'
      ],
      examples: [
        'Combustion reactions: exothermic processes releasing heat.',
        'Ice melting: endothermic process requiring energy input.',
        'Photosynthesis: converting light energy into chemical energy.'
      ],
      diagram: 'Energy diagrams showing enthalpy and entropy changes'
    },
    'organic chemistry': {
      image: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=400&auto=format&fit=crop',
      overview: 'Organic chemistry is the study of carbon-containing compounds and their reactions. Carbon\'s ability to form four covalent bonds allows for an enormous variety of molecular structures and reactions.',
      keyPoints: [
        'Hydrocarbons: alkanes, alkenes, alkynes, and aromatic compounds.',
        'Functional groups: alcohols, aldehydes, ketones, carboxylic acids.',
        'Nomenclature: IUPAC naming system for organic compounds.',
        'Reaction mechanisms: substitution, elimination, addition reactions.',
        'Stereochemistry: isomers, chirality, and optical activity.'
      ],
      examples: [
        'Methane (CH₄) - simplest alkane, main component of natural gas.',
        'Ethanol (C₂H₅OH) - alcohol used in beverages and fuel.',
        'Benzene (C₆H₆) - aromatic compound with delocalized electrons.'
      ],
      diagram: 'Interactive molecular structures of organic compounds'
    },
    'stoichiometry': {
      image: 'https://images.unsplash.com/photo-1532187875605-183881409d20?q=80&w=400&auto=format&fit=crop',
      overview: 'Stoichiometry is the quantitative relationship between reactants and products in chemical reactions. It allows us to calculate the amounts of substances consumed and produced in chemical processes.',
      keyPoints: [
        'Balancing chemical equations.',
        'Mole concept and Avogadro\'s number.',
        'Molar mass and mass-to-mole conversions.',
        'Limiting reactants and percent yield.',
        'Solution stoichiometry and concentration calculations.'
      ],
      examples: [
        'Combustion of methane: CH₄ + 2O₂ → CO₂ + 2H₂O.',
        'Titration: determining unknown concentration using known reactants.',
        'Percent yield: comparing actual vs theoretical product amounts.'
      ],
      diagram: 'Balanced equation visualization with mole ratios'
    },
    'equilibrium': {
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=400&auto=format&fit=crop',
      overview: 'Chemical equilibrium occurs when the rates of forward and reverse reactions are equal, resulting in constant concentrations of reactants and products. The equilibrium constant (K) quantifies the position of equilibrium.',
      keyPoints: [
        'Dynamic equilibrium: reactions continue but concentrations remain constant.',
        'Equilibrium constant (K): ratio of product to reactant concentrations.',
        'Le Chatelier\'s principle: predicting equilibrium shifts.',
        'Factors affecting equilibrium: concentration, temperature, pressure.',
        'Acid-base equilibria and pH calculations.'
      ],
      examples: [
        'Haber process: N₂ + 3H₂ ⇌ 2NH₃ for ammonia production.',
        'Buffer solutions: maintaining constant pH in biological systems.',
        'Solubility equilibria: saturated solutions and Ksp values.'
      ],
      diagram: 'Equilibrium reaction visualization showing forward and reverse rates'
    },
    'redox reactions': {
      image: 'https://images.unsplash.com/photo-1514373941175-0a141072bbc8?q=80&w=400&auto=format&fit=crop',
      overview: 'Redox (reduction-oxidation) reactions involve the transfer of electrons between species. Oxidation is the loss of electrons, while reduction is the gain of electrons. These reactions are fundamental to many chemical processes.',
      keyPoints: [
        'Oxidation numbers: tracking electron transfer.',
        'Balancing redox equations using half-reactions.',
        'Oxidizing and reducing agents.',
        'Electrochemical cells: galvanic and electrolytic cells.',
        'Standard electrode potentials and cell voltage.'
      ],
      examples: [
        'Rusting of iron: Fe → Fe²⁺ + 2e⁻ (oxidation).',
        'Battery operation: converting chemical energy to electrical energy.',
        'Corrosion prevention: sacrificial anodes and protective coatings.'
      ],
      diagram: 'Electron transfer visualization in redox reactions'
    },
    'atomic structure': {
      image: 'https://images.unsplash.com/photo-1581093196277-9f608109ca46?q=80&w=400&auto=format&fit=crop',
      overview: 'Atomic structure refers to the constitution of an atom, comprising a nucleus of protons and neutrons, orbited by electrons. Understanding atomic structure is key to understanding chemical reactivity and bonding.',
      keyPoints: [
        'Subatomic particles: protons, neutrons, and electrons.',
        'Atomic number, mass number, and isotopes.',
        'Bohr model vs. Quantum mechanical model.',
        'Electron configuration and orbital shapes.',
        'Photons and energy levels (Excitation/Relaxation).'
      ],
      examples: [
        'Hydrogen spectrum: discrete lines showing quantized energy levels.',
        'Isotopes of Carbon: C-12, C-13, and the radioactive C-14.',
        'Flame tests: different elements producing characteristic colors.'
      ],
      diagram: 'Orbital visualization and energy level transitions'
    },
    'chemical kinetics': {
      image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=400&auto=format&fit=crop',
      overview: 'Chemical kinetics is the study of the rates of chemical reactions and the factors that affect them. It provides insight into the reaction mechanism—the step-by-step pathway from reactants to products.',
      keyPoints: [
        'Reaction rate laws and order of reaction.',
        'Collision theory and activation energy.',
        'Factors affecting rates: concentration, temperature, catalysts.',
        'Integrated rate laws for zero, first, and second-order reactions.',
        'Enzyme kinetics and biological catalysts.'
      ],
      examples: [
        'Decomposition of hydrogen peroxide catalyzed by manganese dioxide.',
        'Half-life of medications in the human body.',
        'Food preservation through refrigeration (slowing down reaction rates).'
      ],
      diagram: 'Energy profile diagrams with and without catalysts'
    },
    'electrochemistry': {
      image: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?q=80&w=400&auto=format&fit=crop',
      overview: 'Electrochemistry is the study of the relationship between electrical energy and chemical change. It encompasses both the generation of electricity from chemical reactions (batteries) and the use of electricity to drive chemical reactions (electrolysis).',
      keyPoints: [
        'Galvanic (voltaic) cells and spontaneous reactions.',
        'Electrolytic cells and non-spontaneous reactions.',
        'Standard reduction potentials and the Nernst equation.',
        'Corrosion and its prevention.',
        'Fuel cells and modern battery technology.'
      ],
      examples: [
        'Lead-acid batteries used in vehicles.',
        'Electroplating jewelry with gold or silver.',
        'Production of aluminum through electrolysis of bauxite.'
      ],
      diagram: 'Animated galvanic cell with electron and ion flow'
    },
    'solutions': {
      image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=400&auto=format&fit=crop',
      overview: 'Solutions are homogeneous mixtures of two or more substances. This topic explores how solutes dissolve in solvents and the resulting properties of the solution, including concentration and colligative properties.',
      keyPoints: [
        'Molarity, molality, and mole fraction.',
        'Solubility rules and factors (temperature/pressure).',
        'Raoult\'s law and vapor pressure lowering.',
        'Colligative properties: boiling point elevation, freezing point depression.',
        'Osmosis and osmotic pressure.'
      ],
      examples: [
        'Salting roads in winter to lower the freezing point of water.',
        'Intravenous (IV) fluids matched to blood osmotic pressure.',
        'Antifreeze in car radiators for both winter and summer protection.'
      ],
      diagram: 'Molecular view of dissolution and osmosis'
    },
    'biomolecules': {
      image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=400&auto=format&fit=crop',
      overview: 'Biomolecules are organic molecules that are present in living organisms. These include carbohydrates, proteins, lipids, and nucleic acids, which are essential for various biological processes.',
      keyPoints: [
        'Classification of carbohydrates and their functions.',
        'Amino acids and protein structure hierarchy.',
        'Lipids and cell membrane composition.',
        'Structure and function of DNA and RNA.',
        'Enzymes as biological catalysts.'
      ],
      examples: [
        'Glucose as a primary source of energy.',
        'Hemoglobin for oxygen transport in blood.',
        'Phospholipids forming the lipid bilayer of cells.'
      ],
      diagram: 'Interactive visualization for Biochemistry'
    }
  };

  // Try exact match first
  if (contentMap[topicLower]) {
    return contentMap[topicLower];
  }

  // Try partial match
  for (const key in contentMap) {
    if (topicLower.includes(key) || key.includes(topicLower)) {
      return contentMap[key];
    }
  }

  // Default content
  return {
    image: 'https://images.unsplash.com/photo-1532187875605-183881409d20?q=80&w=400&auto=format&fit=crop',
    overview: 'This concept covers important principles in chemistry. Explore the key points and examples to deepen your understanding.',
    keyPoints: [
      'Fundamental principles and definitions.',
      'Key relationships and patterns.',
      'Important applications and examples.',
      'Common misconceptions to avoid.',
      'Connections to other chemistry topics.'
    ],
    examples: [
      'Real-world applications of this concept.',
      'Common examples from everyday life.',
      'Laboratory demonstrations and experiments.'
    ],
    diagram: 'Interactive visualization of this concept'
  };
};

// Default concepts if database is empty
const getDefaultConcepts = () => {
  return [
    {
      _id: 'default-acids-bases',
      title: 'Acids & Bases',
      topic: 'Acids & Bases',
      description: 'Understanding the fundamental properties and behavior of acids and bases.',
      difficulty: 'Intermediate',
      estimatedTime: 45,
      status: 'approved',
      isActive: true,
      content: {
        overview: getTopicContent('Acids & Bases').overview,
        keyPoints: getTopicContent('Acids & Bases').keyPoints,
        examples: getTopicContent('Acids & Bases').examples
      }
    },
    {
      _id: 'default-periodic-table',
      title: 'Periodic Table',
      topic: 'Periodic Table',
      description: 'Systematic arrangement of chemical elements and periodic trends.',
      difficulty: 'Beginner',
      estimatedTime: 30,
      status: 'approved',
      isActive: true,
      content: {
        overview: getTopicContent('Periodic Table').overview,
        keyPoints: getTopicContent('Periodic Table').keyPoints,
        examples: getTopicContent('Periodic Table').examples
      }
    },
    {
      _id: 'default-chemical-bonding',
      title: 'Chemical Bonding',
      topic: 'Chemical Bonding',
      description: 'Forces that hold atoms together in molecules and compounds.',
      difficulty: 'Intermediate',
      estimatedTime: 50,
      status: 'approved',
      isActive: true,
      content: {
        overview: getTopicContent('Chemical Bonding').overview,
        keyPoints: getTopicContent('Chemical Bonding').keyPoints,
        examples: getTopicContent('Chemical Bonding').examples
      }
    },
    {
      _id: 'default-thermodynamics',
      title: 'Thermodynamics',
      topic: 'Thermodynamics',
      description: 'Energy changes in chemical reactions and physical processes.',
      difficulty: 'Advanced',
      estimatedTime: 60,
      status: 'approved',
      isActive: true,
      content: {
        overview: getTopicContent('Thermodynamics').overview,
        keyPoints: getTopicContent('Thermodynamics').keyPoints,
        examples: getTopicContent('Thermodynamics').examples
      }
    },
    {
      _id: 'default-organic-chemistry',
      title: 'Organic Chemistry',
      topic: 'Organic Chemistry',
      description: 'Study of carbon-containing compounds and their reactions.',
      difficulty: 'Intermediate',
      estimatedTime: 55,
      status: 'approved',
      isActive: true,
      content: {
        overview: getTopicContent('Organic Chemistry').overview,
        keyPoints: getTopicContent('Organic Chemistry').keyPoints,
        examples: getTopicContent('Organic Chemistry').examples
      }
    },
    {
      _id: 'default-stoichiometry',
      title: 'Stoichiometry',
      topic: 'Stoichiometry',
      description: 'Quantitative relationships in chemical reactions.',
      difficulty: 'Intermediate',
      estimatedTime: 40,
      status: 'approved',
      isActive: true,
      content: {
        overview: getTopicContent('Stoichiometry').overview,
        keyPoints: getTopicContent('Stoichiometry').keyPoints,
        examples: getTopicContent('Stoichiometry').examples
      }
    },
    {
      _id: 'default-equilibrium',
      title: 'Chemical Equilibrium',
      topic: 'Equilibrium',
      description: 'Dynamic balance in reversible chemical reactions.',
      difficulty: 'Advanced',
      estimatedTime: 50,
      status: 'approved',
      isActive: true,
      content: {
        overview: getTopicContent('Equilibrium').overview,
        keyPoints: getTopicContent('Equilibrium').keyPoints,
        examples: getTopicContent('Equilibrium').examples
      }
    },
    {
      _id: 'default-redox',
      title: 'Redox Reactions',
      topic: 'Redox Reactions',
      description: 'Electron transfer in oxidation-reduction reactions.',
      difficulty: 'Intermediate',
      estimatedTime: 45,
      status: 'approved',
      isActive: true,
      content: {
        overview: getTopicContent('Redox Reactions').overview,
        keyPoints: getTopicContent('Redox Reactions').keyPoints,
        examples: getTopicContent('Redox Reactions').examples
      }
    },
    {
      _id: 'default-atomic-structure',
      title: 'Atomic Structure',
      topic: 'Atomic Structure',
      description: 'The constitution of atoms and subatomic particles.',
      difficulty: 'Beginner',
      estimatedTime: 35,
      status: 'approved',
      isActive: true,
      content: {
        overview: getTopicContent('Atomic Structure').overview,
        keyPoints: getTopicContent('Atomic Structure').keyPoints,
        examples: getTopicContent('Atomic Structure').examples
      }
    },
    {
      _id: 'default-kinetics',
      title: 'Chemical Kinetics',
      topic: 'Chemical Kinetics',
      description: 'Study of reaction rates and mechanisms.',
      difficulty: 'Intermediate',
      estimatedTime: 50,
      status: 'approved',
      isActive: true,
      content: {
        overview: getTopicContent('Chemical Kinetics').overview,
        keyPoints: getTopicContent('Chemical Kinetics').keyPoints,
        examples: getTopicContent('Chemical Kinetics').examples
      }
    },
    {
      _id: 'default-electrochemistry',
      title: 'Electrochemistry',
      topic: 'Electrochemistry',
      description: 'Electricity and chemical changes.',
      difficulty: 'Advanced',
      estimatedTime: 60,
      status: 'approved',
      isActive: true,
      content: {
        overview: getTopicContent('Electrochemistry').overview,
        keyPoints: getTopicContent('Electrochemistry').keyPoints,
        examples: getTopicContent('Electrochemistry').examples
      }
    },
    {
      _id: 'default-solutions',
      title: 'Solutions & Solubility',
      topic: 'Solutions',
      description: 'Properties of homogeneous mixtures and solubility.',
      difficulty: 'Intermediate',
      estimatedTime: 40,
      status: 'approved',
      isActive: true,
      content: {
        overview: getTopicContent('Solutions').overview,
        keyPoints: getTopicContent('Solutions').keyPoints,
        examples: getTopicContent('Solutions').examples
      }
    }
  ];
};

const ConceptPages = ({ initialTopic }) => {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview | key-points | examples
  const [progress, setProgress] = useState({}); // Track progress per concept
  const [showConceptMap, setShowConceptMap] = useState(false);
  const [conceptMapTopic, setConceptMapTopic] = useState(null);

  // Listen for concept map open event
  useEffect(() => {
    const handleOpenConceptMap = (event) => {
      const { topic } = event.detail || {};
      if (topic) {
        setConceptMapTopic(topic);
        setShowConceptMap(true);
      }
    };

    window.addEventListener('open-topic-concept-map', handleOpenConceptMap);

    return () => {
      window.removeEventListener('open-topic-concept-map', handleOpenConceptMap);
    };
  }, []);

  // Fetch approved + active concepts for public view
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/concept').catch(() => ({ data: [] }));
        let visible = (data || []).filter(c => c.status === 'approved' && c.isActive !== false);

        // Always merge with default concepts to ensure we have content
        const defaults = getDefaultConcepts();
        const defaultMap = new Map(defaults.map(c => [c.topic.toLowerCase(), c]));

        // Merge: use API concepts if they exist, otherwise use defaults
        const merged = visible.map(concept => {
          const defaultConcept = defaultMap.get((concept.topic || '').toLowerCase());
          if (defaultConcept && !concept.content?.overview) {
            // Enhance API concept with default content if missing
            return {
              ...concept,
              content: {
                ...concept.content,
                overview: concept.content?.overview || defaultConcept.content.overview,
                keyPoints: concept.content?.keyPoints || defaultConcept.content.keyPoints,
                examples: concept.content?.examples || defaultConcept.content.examples
              }
            };
          }
          return concept;
        });

        // Add defaults that aren't in API results
        const existingTopics = new Set(merged.map(c => (c.topic || '').toLowerCase()));
        defaults.forEach(defaultConcept => {
          if (!existingTopics.has((defaultConcept.topic || '').toLowerCase())) {
            merged.push(defaultConcept);
          }
        });

        const finalConcepts = merged.length > 0 ? merged : defaults;
        setConcepts(finalConcepts);

        console.log('Loaded concepts:', finalConcepts.length, finalConcepts.map(c => c.topic));

        if (finalConcepts.length) {
          if (initialTopic) {
            const match = finalConcepts.find(
              (c) => (c.topic || '').toLowerCase() === initialTopic.toLowerCase()
            );
            setActiveId(match ? match._id : finalConcepts[0]._id);
          } else {
            setActiveId(finalConcepts[0]._id);
          }
        }
      } catch (e) {
        // On error, use default concepts
        console.warn('Failed to load concepts from API, using defaults:', e);
        const defaults = getDefaultConcepts();
        setConcepts(defaults);
        if (defaults.length > 0) {
          if (initialTopic) {
            const match = defaults.find(
              (c) => (c.topic || '').toLowerCase() === initialTopic.toLowerCase()
            );
            setActiveId(match ? match._id : defaults[0]._id);
          } else {
            setActiveId(defaults[0]._id);
          }
        }
        setError('');
      } finally {
        setLoading(false);
      }
    })();
  }, [initialTopic]);

  const activeConcept = useMemo(
    () => concepts.find((c) => c._id === activeId) || null,
    [concepts, activeId]
  );

  // If initialTopic changes later (e.g., from Learning Path), re-focus the matching concept
  useEffect(() => {
    if (!initialTopic || !concepts.length) return;
    const match = concepts.find(
      (c) => (c.topic || '').toLowerCase() === initialTopic.toLowerCase()
    );
    if (match && match._id !== activeId) {
      setActiveId(match._id);
    }
  }, [initialTopic, concepts, activeId]);

  // Update concept map topic when active concept changes (if map is open)
  useEffect(() => {
    if (showConceptMap && activeConcept?.topic) {
      setConceptMapTopic(activeConcept.topic);
    }
  }, [activeConcept?.topic, showConceptMap]);


  const handleMarkCompleted = async (topic) => {
    try {
      if (!topic) return;
      await api.post('/user/complete-concept', { topic }).catch(() => {
        // If API fails, just update local state
        setProgress(prev => ({ ...prev, [topic]: 100 }));
      });
      setProgress(prev => ({ ...prev, [topic]: 100 }));
      window.dispatchEvent(new Event('concept-completed'));
      alert(`Marked as completed: ${topic}`);
    } catch (err) {
      setProgress(prev => ({ ...prev, [topic]: 100 }));
      alert('Marked as completed locally');
    }
  };

  const renderContent = () => {
    if (!activeConcept) {
      // Show loading or empty state
      return (
        <div className="concept-layout">
          <div className="concept-main">
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              {loading ? 'Loading concepts...' : 'No concept selected. Please select a concept from the sidebar.'}
            </div>
          </div>
        </div>
      );
    }

    // Always render the new layout for all concepts
    return (
      <div className="concept-layout">
        <div className="concept-main">
          <button
            className="back-btn"
            type="button"
            onClick={() => {
              const event = new CustomEvent('navigate-to-tab', { detail: { tab: 'overview' } });
              window.dispatchEvent(event);
            }}
          >
            ← Back to Dashboard
          </button>

          <div className="concept-header-card">
            <div className="concept-header-left">
              {getTopicContent(activeConcept.topic).image && (
                <div className="concept-image-main">
                  <img 
                    src={getTopicContent(activeConcept.topic).image} 
                    alt={activeConcept.topic}
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                </div>
              )}
              <div>
                <div className="concept-title-main" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {activeConcept.title}
                </div>
                <div className="concept-subtitle-main">
                  {activeConcept.description || `Understanding the fundamental properties and behavior of ${activeConcept.topic || 'this concept'}.`}
                </div>
              </div>
            </div>
            <div className="concept-meta-chips">
              <span className="chip-level">{activeConcept.difficulty || 'Intermediate'}</span>
              {activeConcept.estimatedTime && (
                <span className="chip-time">{activeConcept.estimatedTime} minutes</span>
              )}
            </div>
          </div>

          <div className="concept-tabs">
            <button
              className={`concept-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`concept-tab ${activeTab === 'key-points' ? 'active' : ''}`}
              onClick={() => setActiveTab('key-points')}
            >
              Key Points
            </button>
            <button
              className={`concept-tab ${activeTab === 'examples' ? 'active' : ''}`}
              onClick={() => setActiveTab('examples')}
            >
              Examples
            </button>
          </div>

          <div className="concept-body">
            <div className="concept-body-main">
              <div className="concept-text-block">
                {(() => {
                  // Get content from database first, fallback to topic mapping
                  const dbContent = activeConcept?.content;
                  const topicContent = getTopicContent(activeConcept?.topic);

                  if (activeTab === 'overview') {
                    const overviewText = dbContent?.overview || topicContent.overview || activeConcept?.description;
                    return <p>{overviewText}</p>;
                  }

                  if (activeTab === 'key-points') {
                    const keyPoints = dbContent?.keyPoints || topicContent.keyPoints || [
                      'Key concepts and principles',
                      'Important relationships',
                      'Applications and examples'
                    ];
                    return (
                      <>
                        <h4>Key Points</h4>
                        <ul className="bullet-list">
                          {keyPoints.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </>
                    );
                  }

                  if (activeTab === 'examples') {
                    const examples = dbContent?.examples || topicContent.examples || [
                      'Example applications',
                      'Real-world uses',
                      'Laboratory demonstrations'
                    ];
                    return (
                      <>
                        <h4>Examples</h4>
                        <ul className="bullet-list">
                          {examples.map((example, idx) => (
                            <li key={idx}>{example}</li>
                          ))}
                        </ul>
                      </>
                    );
                  }

                  return null;
                })()}
              </div>

              <div className="interactive-card">
                <div className="interactive-header">Interactive Diagram</div>
                <div className="interactive-frame">
                  <TopicDiagram topic={activeConcept?.topic} />
                </div>
              </div>
            </div>

            <aside className="concept-sidebar-right">
              <div className="sidebar-card">
                <div className="sidebar-title">Actions</div>
                <button
                  className="primary-action"
                  type="button"
                  onClick={() => {
                    const event = new CustomEvent('navigate-to-tab', { detail: { tab: 'quizzes', topic: activeConcept.topic } });
                    window.dispatchEvent(event);
                  }}
                >
                  Take Quiz
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={async () => {
                    if (!activeConcept?._id) return;
                    try {
                      const response = await api.get(`/reports/concept/${activeConcept._id}`, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `${activeConcept.title.replace(/\s+/g, '_')}_Study_Notes.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.parentNode.removeChild(link);
                    } catch (err) {
                      console.error('Download failed', err);
                      alert('Failed to download PDF notes');
                    }
                  }}
                >
                  Download PDF
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => {
                    // Open concept map in a modal or new view
                    const event = new CustomEvent('open-topic-concept-map', {
                      detail: { topic: activeConcept?.topic }
                    });
                    window.dispatchEvent(event);
                  }}
                >
                  Open Concept Map
                </button>
              </div>

              <div className="sidebar-card">
                <div className="sidebar-title">Related Topics</div>
                <ul className="related-list">
                  {(() => {
                    // Get related topics from database or show common ones
                    const related = activeConcept?.relatedConcepts || [];
                    if (related.length > 0) {
                      return related.map((concept, idx) => (
                        <li key={idx}>{typeof concept === 'object' ? concept.title : concept}</li>
                      ));
                    }
                    // Default related topics based on current topic
                    const topicLower = (activeConcept?.topic || '').toLowerCase();
                    const defaultRelated = [
                      'Acids & Bases',
                      'Periodic Table',
                      'Chemical Bonding',
                      'Thermodynamics',
                      'Organic Chemistry'
                    ].filter(t => t.toLowerCase() !== topicLower).slice(0, 3);
                    return defaultRelated.map((topic, idx) => (
                      <li key={idx}>{topic}</li>
                    ));
                  })()}
                </ul>
              </div>

              <div className="sidebar-card">
                <div className="sidebar-title">Your Progress</div>
                <div className="progress-row">
                  <span>Completion</span>
                  <span>{progress[activeConcept?.topic] || 75}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress[activeConcept?.topic] || 75}%` }} />
                </div>
                <ul className="progress-checklist">
                  <li className="done">Notes Read</li>
                  <li className={progress[activeConcept?.topic] >= 100 ? 'done' : 'pending'}>Quiz Completed</li>
                  <li className="pending">Concept Map</li>
                </ul>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => handleMarkCompleted(activeConcept?.topic)}
                >
                  Mark as Completed
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="concept-pages">
      <div className="concept-sidebar">
        <h3>Chemistry Concepts</h3>
        {loading && <div style={{ padding: 8 }}>Loading…</div>}
        {error && <div style={{ padding: 8, color: 'red' }}>{error}</div>}
        <div className="concept-list">
          {concepts.map(concept => (
            <div
              key={concept._id}
              className={`concept-item ${activeId === concept._id ? 'active' : ''}`}
              onClick={() => {
                setActiveId(concept._id);
                setActiveTab('overview'); // Reset to overview when switching concepts
              }}
            >
              <div className="concept-icon">
                {getTopicContent(concept.topic).image ? (
                  <img 
                    src={getTopicContent(concept.topic).image} 
                    alt={concept.topic}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                  />
                ) : (
                  '📘'
                )}
              </div>
              <div className="concept-info">
                <div className="concept-title">{concept.title}</div>
                <div className="concept-description">{concept.description}</div>
                <div className="concept-meta">
                  <span
                    className="difficulty-badge"
                    style={{ color: getDifficultyColor(concept.difficulty) }}
                  >
                    {concept.difficulty}
                  </span>
                  <span className="time-estimate">{concept.estimatedTime} min</span>
                </div>
              </div>
            </div>
          ))}
          {!loading && concepts.length === 0 && (
            <div style={{ padding: 8, color: '#64748b' }}>No approved concepts yet.</div>
          )}
        </div>
      </div>

      <div className="concept-content">
        {showConceptMap ? (
          <div className="concept-map-modal">
            <div className="concept-map-modal-header">
              <h2>Concept Map: {conceptMapTopic || activeConcept?.topic}</h2>
              <button
                className="close-concept-map-btn"
                onClick={() => {
                  setShowConceptMap(false);
                  setConceptMapTopic(null);
                }}
              >
                ✕ Close
              </button>
            </div>
            <div className="concept-map-modal-content">
              <TopicConceptMap
                key={`topic-map-${conceptMapTopic || activeConcept?.topic || 'default'}`}
                topic={conceptMapTopic || activeConcept?.topic}
              />
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default ConceptPages;
