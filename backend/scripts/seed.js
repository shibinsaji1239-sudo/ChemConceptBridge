/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');

const Concept = require('../models/Concept');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

async function main() {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.error('MONGO_URI not defined in .env');
    process.exit(1);
  }
  await mongoose.connect(mongoURI);
  console.log('✅ Connected to MongoDB');

  // Ensure a teacher user exists as creator
  let teacher = await User.findOne({ role: 'teacher' });
  if (!teacher) {
    teacher = await User.create({ name: 'Teacher Seed', email: 'teacher.seed@example.com', password: '', role: 'teacher' });
  }

  // Seed Concepts
  const concepts = [
    {
      title: 'Periodic Table Basics',
      description: 'Introduction to periodic table structure.',
      topic: 'Periodic Table',
      difficulty: 'Beginner',
      estimatedTime: 15,
      createdBy: teacher._id,
      status: 'approved',
      tags: ['elements']
    },
    {
      title: 'Acids & Bases Basics',
      description: 'Introduction to acids, bases, pH, and indicators.',
      topic: 'Acids & Bases',
      difficulty: 'Beginner',
      estimatedTime: 20,
      content: {
        overview: 'Acids donate H+, bases accept H+. pH measures acidity.',
        definitions: 'Arrhenius, Bronsted-Lowry, Lewis definitions',
        examples: ['HCl is a strong acid', 'NaOH is a strong base'],
        visualizations: ['https://example.org/visuals/ph-scale.png'],
        interactiveElements: ['https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_en.html']
      },
      createdBy: teacher._id,
      status: 'approved',
      tags: ['pH', 'acid', 'base']
    },
    {
      title: 'Periodic Table Trends',
      description: 'Atomic radius, ionization energy, and electronegativity trends.',
      topic: 'Periodic Table Trends',
      difficulty: 'Beginner',
      estimatedTime: 25,
      content: {
        overview: 'Trends across periods and down groups.',
        examples: ['Atomic radius decreases across a period']
      },
      createdBy: teacher._id,
      status: 'approved',
      tags: ['periodic', 'trends']
    }
  ];

  // Upsert by title+topic
  const conceptMap = {};
  for (const c of concepts) {
    const doc = await Concept.findOneAndUpdate({ title: c.title, topic: c.topic }, c, { upsert: true, new: true, setDefaultsOnInsert: true });
    conceptMap[c.title] = doc._id;
  }
  
  // Link concepts (prerequisites)
  await Concept.findOneAndUpdate({ title: 'Periodic Table Trends' }, { $addToSet: { prerequisites: conceptMap['Periodic Table Basics'] } });
  await Concept.findOneAndUpdate({ title: 'Acids & Bases Basics' }, { $addToSet: { prerequisites: conceptMap['Periodic Table Basics'] } });
  
  console.log(`✅ Seeded ${concepts.length} concepts and linked dependencies`);

  // Seed Quizzes
  const quizzes = [
    {
      title: 'Acids & Bases Quiz 1',
      description: 'Test fundamental acid-base knowledge',
      topic: 'Acids & Bases',
      difficulty: 'Beginner',
      duration: 10,
      questions: [
        {
          question: 'What is the pH of a neutral solution at 25°C?',
          options: ['0', '7', '14', '1'],
          correct: 1,
          explanation: 'Neutral water has pH 7.',
          misconceptionTraps: ['Thinking pH 0 is neutral']
        },
        {
          question: 'Which of the following is a strong base?',
          options: ['HCl', 'NaOH', 'CH3COOH', 'NH4+'],
          correct: 1,
          explanation: 'NaOH is a strong base.',
          misconceptionTraps: ['Assuming NaOH is an acid']
        }
      ]
    },
    {
      title: 'Periodic Table Basics',
      description: 'Test your knowledge of periodic trends',
      topic: 'Periodic Table',
      difficulty: 'Beginner',
      duration: 10,
      questions: [
        {
          question: 'Atomic radius generally _____ across a period.',
          options: ['increases', 'decreases', 'remains same', 'doubles'],
          correct: 1,
          explanation: 'Effective nuclear charge increases across a period, pulling electrons closer.',
          misconceptionTraps: ['Believing it increases across a period']
        }
      ]
    }
  ];

  for (const q of quizzes) {
    const quiz = await Quiz.findOneAndUpdate({ title: q.title, topic: q.topic }, { ...q, createdBy: teacher._id, isActive: true }, { upsert: true, new: true, setDefaultsOnInsert: true });
    if (!quiz.createdBy) {
      quiz.createdBy = teacher._id;
      await quiz.save();
    }
  }
  console.log(`✅ Seeded ${quizzes.length} quizzes`);

  await mongoose.disconnect();
  console.log('✅ Done');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


