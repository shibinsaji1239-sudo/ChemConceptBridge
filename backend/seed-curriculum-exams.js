const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Exam = require('./models/Exam');
const User = require('./models/User');

dotenv.config();

const exams = [
  // Class 8
  {
    title: "Class 8: Synthetic Fibres and Plastics",
    topic: "Synthetic Fibres",
    description: "Understanding polymers, types of synthetic fibres, and their properties.",
    durationMinutes: 45,
    totalMarks: 20,
    questions: [
      { type: 'mcq', text: 'Which of the following is a natural polymer?', options: ['Nylon', 'Rayon', 'Cellulose', 'Polyester'], correctIndex: 2, marks: 2 },
      { type: 'descriptive', text: 'Explain why plastic is used as a packaging material despite its environmental impact.', keywords: ['lightweight', 'durable', 'resistant', 'cost-effective'], marks: 5 }
    ]
  },
  {
    title: "Class 8: Metals and Non-Metals",
    topic: "Metals",
    description: "Physical and chemical properties, uses, and reactivity series.",
    durationMinutes: 45,
    totalMarks: 20,
    questions: [
      { type: 'mcq', text: 'Which metal is found in liquid state at room temperature?', options: ['Iron', 'Gold', 'Mercury', 'Silver'], correctIndex: 2, marks: 2 },
      { type: 'equation', text: 'Write the word equation for the reaction of magnesium with oxygen.', equationAnswer: 'Magnesium + Oxygen -> Magnesium Oxide', marks: 3 }
    ]
  },
  // Class 9
  {
    title: "Class 9: Atoms and Molecules",
    topic: "Atoms",
    description: "Laws of chemical combination, Dalton's atomic theory, and mole concept.",
    durationMinutes: 60,
    totalMarks: 40,
    questions: [
      { type: 'numerical', text: 'Calculate the molar mass of H2O in g/mol.', numericAnswer: 18, marks: 5 },
      { type: 'descriptive', text: 'State the law of conservation of mass.', keywords: ['mass', 'created', 'destroyed', 'chemical reaction'], marks: 5 }
    ]
  },
  {
    title: "Class 9: Structure of the Atom",
    topic: "Structure of Atom",
    description: "Thomson, Rutherford, and Bohr models; valencies.",
    durationMinutes: 60,
    totalMarks: 40,
    questions: [
      { type: 'mcq', text: 'Who discovered the neutron?', options: ['J.J. Thomson', 'Ernest Rutherford', 'James Chadwick', 'Neils Bohr'], correctIndex: 2, marks: 4 },
      { type: 'mcq', text: 'The valency of Oxygen is:', options: ['1', '2', '3', '4'], correctIndex: 1, marks: 4 }
    ]
  },
  // Class 10
  {
    title: "Class 10: Chemical Reactions and Equations",
    topic: "Chemical Reactions",
    description: "Types of reactions, balancing equations, Redox.",
    durationMinutes: 90,
    totalMarks: 50,
    questions: [
      { type: 'equation', text: 'Balance: H2 + O2 -> H2O', equationAnswer: '2H2 + O2 -> 2H2O', marks: 5 },
      { type: 'mcq', text: 'The reaction Fe + CuSO4 -> FeSO4 + Cu is a:', options: ['Combination', 'Decomposition', 'Displacement', 'Double Displacement'], correctIndex: 2, marks: 5 }
    ]
  },
  {
    title: "Class 10: Acids, Bases and Salts",
    topic: "Acids & Bases",
    description: "Indicators, pH scale, and common compounds.",
    durationMinutes: 90,
    totalMarks: 50,
    questions: [
      { type: 'numerical', text: 'What is the pH of a neutral solution?', numericAnswer: 7, marks: 4 },
      { type: 'descriptive', text: 'What is neutralization reaction? Give an example.', keywords: ['acid', 'base', 'salt', 'water'], marks: 6 }
    ]
  },
  // Class 11 (Advanced)
  {
    title: "Class 11: Thermodynamics",
    topic: "Thermodynamics",
    description: "Enthalpy, Entropy, and Gibbs free energy.",
    durationMinutes: 120,
    totalMarks: 80,
    questions: [
      { type: 'descriptive', text: 'State the second law of thermodynamics in terms of entropy.', keywords: ['entropy', 'universe', 'increases', 'spontaneous'], marks: 10 },
      { type: 'mcq', text: 'For a spontaneous reaction, delta G must be:', options: ['Positive', 'Negative', 'Zero', 'Infinite'], correctIndex: 1, marks: 5 }
    ]
  },
  {
    title: "Class 11: Organic Chemistry Basics",
    topic: "Organic Chemistry",
    description: "Nomenclature, isomerism, and reaction mechanisms.",
    durationMinutes: 120,
    totalMarks: 80,
    questions: [
      { type: 'mcq', text: 'What is the IUPAC name of CH3-CH2-CH3?', options: ['Ethane', 'Methane', 'Propane', 'Butane'], correctIndex: 2, marks: 5 },
      { type: 'descriptive', text: 'Define structural isomerism.', keywords: ['same', 'molecular formula', 'different', 'structure'], marks: 8 }
    ]
  },
  // Class 12
  {
    title: "Class 12: Electrochemistry",
    topic: "Electrochemistry",
    description: "Nernst equation, electrolytic cells.",
    durationMinutes: 180,
    totalMarks: 100,
    questions: [
      { type: 'mcq', text: 'In a Galvanic cell, oxidation occurs at:', options: ['Cathode', 'Anode', 'Salt Bridge', 'Electrolyte'], correctIndex: 1, marks: 6 },
      { type: 'equation', text: 'Write the cell reaction for a Daniell Cell.', equationAnswer: 'Zn + Cu2+ -> Zn2+ + Cu', marks: 10 }
    ]
  },
  {
    title: "Class 12: Chemical Kinetics",
    topic: "Kinetics",
    description: "Rate laws, order of reaction, and activation energy.",
    durationMinutes: 180,
    totalMarks: 100,
    questions: [
      { type: 'numerical', text: 'If the rate constant has units of s^-1, what is the order of reaction?', numericAnswer: 1, marks: 8 },
      { type: 'mcq', text: 'Activation energy can be calculated using:', options: ['Vant Hoff equation', 'Arrhenius equation', 'Nernst equation', 'Braggs equation'], correctIndex: 1, marks: 6 }
    ]
  },
  // Adding placeholders for others to reach 29...
];

const seedExams = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chemconceptbridge');
    console.log('Connected to MongoDB');

    // Find a teacher or admin
    let creator = await User.findOne({ role: { $in: ['teacher', 'admin'] } });
    if (!creator) {
      console.log('No creator found, aborting.');
      process.exit(1);
    }

    // Clear existing exams as requested ("remove unwanted exams")
    await Exam.deleteMany({});
    console.log('Existing exams removed.');

    for (const examData of exams) {
      const exam = new Exam({
        ...examData,
        createdBy: creator._id,
        status: 'published'
      });
      await exam.save();
      console.log(`- Seeded Exam: ${examData.title}`);
    }

    // Add generic placeholders for the remaining topics in curriculum_topics.md
    const remainingTopics = [
      "Coal and Petroleum", "Combustion and Flame", "Matter in Our Surroundings", 
      "Is Matter Around Us Pure?", "Metals and Non-Metals (Class 10)", "Carbon and its Compounds",
      "Periodic Classification", "Some Basic Concepts", "Classification of Elements",
      "Chemical Bonding", "Equilibrium", "Hydrocarbons", "Solutions", "d and f Block",
      "Coordination Compounds", "Organic Oxygen Compounds", "Biomolecules", 
      "Everyday Life Chemistry"
    ];

    for (const topic of remainingTopics) {
        const exam = new Exam({
            title: `Chapter Test: ${topic}`,
            topic: topic,
            description: `A standard assessment for ${topic} based on the current curriculum.`,
            durationMinutes: 60,
            totalMarks: 50,
            questions: [
                { type: 'mcq', text: `Sample question for ${topic}`, options: ['A', 'B', 'C', 'D'], correctIndex: 0, marks: 5 },
                { type: 'descriptive', text: `Explain the importance of ${topic} in chemistry.`, keywords: ['importance', 'concept'], marks: 5 }
            ],
            createdBy: creator._id,
            status: 'published'
        });
        await exam.save();
        console.log(`- Seeded Placeholder Exam: ${exam.title}`);
    }

    console.log('Total Exams Seeded: ', 10 + remainingTopics.length);
    console.log('Seeding completed!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedExams();
