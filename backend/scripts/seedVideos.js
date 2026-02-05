/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');

const Video = require('../models/Video');
const Experiment = require('../models/Experiment');

async function main() {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.error('MONGO_URI not defined in .env');
    process.exit(1);
  }
  await mongoose.connect(mongoURI);
  console.log('✅ Connected to MongoDB');

  // We only sync the video within the experiment record to avoid duplication
  const WORKING_VIDEOS = {
    'Acid-Base Titration Animation': {
      url: 'https://www.youtube.com/watch?v=8UiuE7Xx5l8',
      expTitle: 'Acid-Base Titration (Classic)'
    }
  };

  console.log('🔄 Syncing experiment videos...');

  for (const [title, data] of Object.entries(WORKING_VIDEOS)) {
    // We NO LONGER update the Video collection here to prevent duplicates
    // 1. Update Experiment Collection
    const exp = await Experiment.findOne({ title: data.expTitle });
    if (exp && exp.videos && exp.videos.length > 0) {
      exp.videos[0].url = data.url;
      exp.videos[0].title = title;
      exp.videos[0].type = 'youtube';
      await exp.save();
      console.log(`✅ Updated Experiment Video: ${data.expTitle}`);
    }
  }

  // Explicitly remove any remaining platform videos with this title
  await Video.deleteMany({ title: 'Acid-Base Titration Animation' });

  await mongoose.disconnect();
  console.log('✅ Video synchronization complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
