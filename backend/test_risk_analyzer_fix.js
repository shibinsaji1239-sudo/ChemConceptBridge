// backend/test_risk_analyzer_fix.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { getRiskAnalysis } = require('./controllers/conceptDependencyController');
const User = require('./models/User');

dotenv.config();

async function runTest() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chem-concept-bridge');
    console.log('Connected.');

    // Find a teacher
    const teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.error('No teacher found in database. Please seed users first.');
      process.exit(1);
    }

    console.log(`Testing Risk Analysis for Class View as teacher: ${teacher.email}`);

    // Mock request and response
    const req = {
      params: { userId: 'class' },
      user: {
        _id: teacher._id,
        id: teacher._id,
        role: teacher.role,
        email: teacher.email
      }
    };

    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };

    await getRiskAnalysis(req, res);

    if (res.statusCode === 200) {
      console.log('✅ Success: API returned 200 OK');
      console.log('Response summary:', {
        hasAnalysis: !!res.data.analysis,
        analysisCount: res.data.analysis ? res.data.analysis.length : 0,
        hasGraph: !!res.data.graph
      });
    } else {
      console.error(`❌ Failure: API returned ${res.statusCode}`);
      console.error('Error details:', res.data);
    }

  } catch (error) {
    console.error('Test script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

runTest();
