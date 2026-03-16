const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Experiment = require('./models/Experiment');
const Exam = require('./models/Exam');
const User = require('./models/User');

dotenv.config();

const seedRest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chemconceptbridge');
        console.log('Connected to MongoDB');

        let creator = await User.findOne({ role: { $in: ['admin', 'teacher'] } });

        const newExperiments = [
            {
                title: 'Virtual Titration: Strong Acid vs Strong Base',
                description: 'Determine the concentration of an unknown base using standardized HCl.',
                steps: ['Fill buret', 'Add indicator', 'Titrate until color change'],
                topic: 'Acids & Bases',
                visibility: 'public',
                createdBy: creator?._id
            },
            {
                title: 'Electrolysis of Water',
                description: 'Decompose water into hydrogen and oxygen gases using electrical current.',
                steps: ['Set up electrodes', 'Apply voltage', 'Measure gas volumes'],
                topic: 'Electrochemistry',
                visibility: 'public',
                createdBy: creator?._id
            }
        ];

        for (const e of newExperiments) {
            const exists = await Experiment.findOne({ title: e.title });
            if (!exists) {
                await new Experiment(e).save();
                console.log(`- Seeded Experiment: ${e.title}`);
            }
        }

        const newExams = [
            {
                title: 'Mid-term Assessment: General Chemistry',
                description: 'Comprehensive exam covering Atomic Structure, Bonding, and Periodic Table.',
                topic: 'General Chemistry',
                durationMinutes: 90,
                status: 'published',
                questions: [
                    {
                        type: 'mcq',
                        text: 'What is the principal quantum number of the outermost shell of Calcium?',
                        options: ['2', '3', '4', '5'],
                        correctIndex: 2,
                        marks: 4
                    }
                ],
                createdBy: creator?._id
            }
        ];

        for (const ex of newExams) {
            const exists = await Exam.findOne({ title: ex.title });
            if (!exists) {
                await new Exam(ex).save();
                console.log(`- Seeded Exam: ${ex.title}`);
            }
        }

        console.log('Final seeding completed!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedRest();
