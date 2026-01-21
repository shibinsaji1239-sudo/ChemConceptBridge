const mongoose = require('mongoose');
require('dotenv').config();
const Experiment = require('../models/Experiment');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB for seeding experiments');

    const existing = await Experiment.countDocuments();
    if (existing > 0) {
      console.log('Experiments already present, skipping seed.');
      process.exit(0);
    }

    const examples = [
      {
        title: 'Acid-Base Titration (Classic)',
        description: 'Perform a titration to find equivalence point using phenolphthalein.',
        animation: 'neutralization',
        apparatus: ['Beaker', 'Burette', 'Acid solution', 'Base solution', 'Indicator'],
        steps: [
          'Pour acid solution into beaker (measure volume)',
          'Add a few drops of indicator',
          'Slowly add base from burette while stirring',
          'Observe color transition and stop at endpoint',
          'Record final pH and calculate concentration'
        ],
        expectedResult: 'Solution changes color at the equivalence point, pH approaches neutral.',
        safetyPrecautions: 'Wear goggles and gloves. Handle acids and bases carefully.',
        principles: 'Titration demonstrates neutralization and stoichiometric calculation of concentration.'
        ,
        videos: [
          {
            title: 'Titration Demonstration (short)',
            url: 'https://www.youtube.com/watch?v=rK9R-G03Xms',
            description: 'Short demo of titration technique and endpoint observation.',
            type: 'mp4'
          }
        ],
        thumbnail: 'https://images.unsplash.com/photo-1581093588401-0e8b29a1d7d5?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.0.3&s=3f2b2d3b9a0a5b7d'
      },
      {
        title: 'Combustion Demo',
        description: 'Observe heat release and temperature change during combustion.',
        animation: 'combustion',
        apparatus: ['Burner', 'Fuel sample', 'Thermometer'],
        steps: ['Prepare burner and fuel', 'Ignite fuel', 'Observe flame and temperature increase', 'Measure temperature change'],
        expectedResult: 'Temperature rises and flame intensity varies with fuel.',
        safetyPrecautions: 'Keep fire extinguisher nearby. Do not leave flame unattended.',
        principles: 'Combustion is an exothermic redox reaction releasing heat.'
        ,
        videos: [
          {
            title: 'Combustion Safety & Demo',
            url: 'https://www.youtube.com/watch?v=FOfp_KjW0n4',
            description: 'Short clip showing a controlled combustion demonstration.',
            type: 'mp4'
          }
        ],
        thumbnail: 'https://images.unsplash.com/photo-1541534401786-7ff2f1e0c5d6?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.0.3&s=8b6b9c4f1ea3b5c6'
      }
    ];

    await Experiment.insertMany(examples);
    console.log('Seeded experiments successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  }
}

seed();
