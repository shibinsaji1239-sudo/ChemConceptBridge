const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const ctrl = require('./controllers/conceptDependencyController');
const User = require('./models/User');

async function testRiskAnalysis() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find a teacher to simulate
    const teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.error('No teacher found in database');
      process.exit(1);
    }
    
    console.log(`Simulating teacher: ${teacher.name} (${teacher._id})`);
    
    const req = {
      params: { userId: 'class' },
      user: teacher
    };
    
    const res = {
      json: (data) => {
        console.log('Response Success:', JSON.stringify(data, null, 2).slice(0, 500) + '...');
      },
      status: (code) => {
        console.log('Status Code:', code);
        return res;
      }
    };
    
    await ctrl.getRiskAnalysis(req, res);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Test Error:', err);
    process.exit(1);
  }
}

testRiskAnalysis();
