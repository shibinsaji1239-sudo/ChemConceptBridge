const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Video = require('./models/Video');
const User = require('./models/User');

dotenv.config();

const seedVideos = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chemconceptbridge');
        console.log('Connected to MongoDB');

        let creator = await User.findOne({ role: { $in: ['admin', 'teacher'] } });

        const newVideos = [
            {
                title: 'Introduction to Quantum Numbers',
                description: 'A comprehensive guide to n, l, m, and s quantum numbers.',
                url: 'https://www.youtube.com/embed/Aoi44W6p-N4', // Example educational video
                topic: 'Atomic Structure',
                duration: 12,
                createdBy: creator?._id
            },
            {
                title: 'Collision Theory & Activation Energy',
                description: 'Visualizing how particles react and the role of catalysts.',
                url: 'https://www.youtube.com/embed/Xp-S_XvGf3Q',
                topic: 'Chemical Kinetics',
                duration: 15,
                createdBy: creator?._id
            },
            {
                title: 'Nernst Equation Explained',
                description: 'Calculation of cell potential under non-standard conditions.',
                url: 'https://www.youtube.com/embed/fTIDH9UvYRE',
                topic: 'Electrochemistry',
                duration: 18,
                createdBy: creator?._id
            },
            {
                title: 'Colligative Properties Animation',
                description: 'Molecular visualization of boiling point elevation and freezing point depression.',
                url: 'https://www.youtube.com/embed/z9LpP6_V3As',
                topic: 'Solutions',
                duration: 10,
                createdBy: creator?._id
            }
        ];

        for (const v of newVideos) {
            const exists = await Video.findOne({ title: v.title });
            if (!exists) {
                await new Video(v).save();
                console.log(`- Seeded Video: ${v.title}`);
            }
        }

        console.log('Video seeding completed!');
        process.exit(0);
    } catch (err) {
        console.error('Video seeding error:', err);
        process.exit(1);
    }
};

seedVideos();
