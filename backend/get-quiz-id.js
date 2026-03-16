const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Quiz = require('./models/Quiz');

async function getQuiz() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);
    const q = await Quiz.findOne({ isActive: true });
    console.log(q ? q._id.toString() : 'none');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
getQuiz();
