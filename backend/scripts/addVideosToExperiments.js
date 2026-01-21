const mongoose = require('mongoose');
require('dotenv').config();
const Experiment = require('../models/Experiment');

async function addVideos() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB for updating experiments with videos');

    const experiments = await Experiment.find();
    for (const exp of experiments) {
      if (!exp.videos || exp.videos.length === 0) {
        exp.videos = [
          {
            title: exp.title + ' — Intro Video',
            url: 'https://www.youtube.com/watch?v=ANi709MYnWg',
            description: 'Introductory demo video for ' + exp.title,
            type: 'mp4'
          }
        ];
        await exp.save();
        console.log('Updated:', exp.title);
      } else {
        console.log('Already has videos:', exp.title);
      }
    }

    console.log('Update complete');
    process.exit(0);
  } catch (err) {
    console.error('Update failed', err);
    process.exit(1);
  }
}

addVideos();
