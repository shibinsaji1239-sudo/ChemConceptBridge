const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Concept = require('./models/Concept');
const Quiz = require('./models/Quiz');
const User = require('./models/User');

dotenv.config();

const seedData = async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI || 'mongodb://localhost:27017/chemconceptbridge');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chemconceptbridge');
        console.log('Connected to MongoDB');

        // Find an admin or teacher user to assign as creator
        let creator = await User.findOne({ role: { $in: ['admin', 'teacher'] } });
        if (!creator) {
            console.log('No admin/teacher found, creating a system user...');
            creator = new User({
                name: 'System Content',
                email: 'content@chemconcept.com',
                password: 'password123',
                role: 'admin'
            });
            await creator.save();
        }

        const newTopics = [
            {
                title: 'Atomic Structure & Quantum Numbers',
                topic: 'Atomic Structure',
                description: 'Deep dive into the nature of atoms, orbitals, and electron configurations.',
                difficulty: 'Intermediate',
                estimatedTime: 40,
                content: {
                    overview: 'Atoms are the building blocks of matter. This module explores how electrons are arranged in shells and subshells.',
                    keyPoints: ['Planck\'s Quantum Theory', 'Heisenberg Uncertainty Principle', 'Quantum Numbers (n, l, m, s)', 'Aufbau Principle'],
                    examples: ['Ground state of Iron', 'Excitation of Hydrogen electron']
                }
            },
            {
                title: 'Chemical Kinetics: Rates of Reaction',
                topic: 'Chemical Kinetics',
                description: 'Understanding how fast reactions happen and why.',
                difficulty: 'Intermediate',
                estimatedTime: 45,
                content: {
                    overview: 'Kinetics deals with reaction speeds and mechanisms.',
                    keyPoints: ['Rate Laws', 'Order of Reaction', 'Collision Theory', 'Catalysis'],
                    examples: ['Haber Process kinetics', 'Decomposition of N2O5']
                }
            },
            {
                title: 'Electrochemistry & Redox Cells',
                topic: 'Electrochemistry',
                description: 'The science of electricity-driven chemical changes.',
                difficulty: 'Advanced',
                estimatedTime: 60,
                content: {
                    overview: 'Electrochemistry bridges the gap between chemical energy and electrical energy.',
                    keyPoints: ['Galvanic Cells', 'Standard Reduction Potential', 'Nernst Equation', 'Faraday\'s Laws'],
                    examples: ['Daniel Cell', 'Silver Plating']
                }
            },
            {
                title: 'Solutions & Colligative Properties',
                topic: 'Solutions',
                description: 'Behavior of homogeneous mixtures and their unique properties.',
                difficulty: 'Intermediate',
                estimatedTime: 35,
                content: {
                    overview: 'Solutions are everywhere. Learn why salt melts ice and how osmosis works.',
                    keyPoints: ['Vapor Pressure Lowering', 'Boiling Point Elevation', 'Freezing Point Depression', 'Osmotic Pressure'],
                    examples: ['Ocean water freezing', 'Preservation using sugar/salt']
                }
            }
        ];

        console.log('Seeding concepts...');
        for (const t of newTopics) {
            const exists = await Concept.findOne({ topic: t.topic, title: t.title });
            if (!exists) {
                await new Concept({ ...t, createdBy: creator._id, status: 'approved' }).save();
                console.log(`- Seeded Concept: ${t.title}`);
            } else {
                console.log(`- Concept already exists: ${t.title}`);
            }
        }

        const newQuizzes = [
            {
                title: 'Atomic Structure Challenge',
                topic: 'Atomic Structure',
                description: 'Test your knowledge on orbits, shells, and quantum numbers.',
                difficulty: 'Intermediate',
                duration: 15,
                questions: [
                    {
                        question: 'Which quantum number determines the shape of an orbital?',
                        options: ['Principal (n)', 'Azimuthal (l)', 'Magnetic (m)', 'Spin (s)'],
                        correct: 1,
                        explanation: 'The azimuthal (subsidiary) quantum number "l" determines the three-dimensional shape of the orbital.',
                        misconceptionTraps: ['Confusing n with size only', 'Thinking m determines shape']
                    },
                    {
                        question: 'Assertion: No two electrons in an atom can have the same set of four quantum numbers. Reason: This is known as Pauli\'s Exclusion Principle.',
                        options: [
                            'Both A and R are true and R is the correct explanation of A.',
                            'Both A and R are true but R is NOT the correct explanation of A.',
                            'A is true but R is false.',
                            'A is false but R is true.'
                        ],
                        correct: 0,
                        explanation: 'Pauli\'s Exclusion Principle states specifically that each electron must have a unique set of quantum numbers.',
                        misconceptionTraps: ['Confusing with Hund\'s rule']
                    }
                ]
            },
            {
                title: 'Kinetics & Reaction Speeds',
                topic: 'Chemical Kinetics',
                description: 'Fast or slow? Find out how much you know about kinetics.',
                difficulty: 'Intermediate',
                duration: 20,
                questions: [
                    {
                        question: 'What happens to the rate of a reaction when the temperature is increased?',
                        options: ['Decreases', 'Increases', 'Stays the same', 'Becomes zero'],
                        correct: 1,
                        explanation: 'Increasing temperature increases the kinetic energy of particles, leading to more frequent and energetic collisions.',
                        misconceptionTraps: ['Thinking some exothermic reactions slow down (equilibrium vs rate)']
                    }
                ]
            }
        ];

        console.log('Seeding quizzes...');
        for (const q of newQuizzes) {
            const exists = await Quiz.findOne({ topic: q.topic, title: q.title });
            if (!exists) {
                await new Quiz({ ...q, createdBy: creator._id }).save();
                console.log(`- Seeded Quiz: ${q.title}`);
            } else {
                console.log(`- Quiz already exists: ${q.title}`);
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedData();
