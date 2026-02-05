const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Get a user token
    const user = await User.findOne({ email: 'alice.student@example.com' });
    if (!user) {
      console.error("No student user found (alice.student@example.com)");
      return;
    }
    
    const port = process.env.PORT || 10001;
    const baseUrl = `http://localhost:${port}`;
    console.log(`Connecting to ${baseUrl}`);

    // Let's try to login first
    const loginRes = await axios.post(`${baseUrl}/api/auth/login`, {
      email: user.email,
      password: 'Student@123' 
    });
    
    const token = loginRes.data.token;
    console.log("Got token");
    
    // Now call generate-ai
    console.log("Requesting AI Quiz Generation for 'Thermodynamics'...");
    const res = await axios.post(`${baseUrl}/api/quiz/generate-ai`, {
      topic: 'Thermodynamics',
      difficulty: 'Intermediate',
      count: 3
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("✅ Success! Generated Quiz ID:", res.data._id);
    console.log("Title:", res.data.title);
    console.log("Questions count:", res.data.questions.length);
    
    res.data.questions.forEach((q, i) => {
      console.log(`\nQ${i+1}: ${q.question}`);
      console.log(`Options: ${q.options.join(', ')}`);
      console.log(`Correct Index: ${q.correct}`);
    });
    
  } catch (err) {
    console.error("Error details:", err.message);
    if (err.response) {
      console.error("Response status:", err.response.status);
      console.error("Response data:", err.response.data);
    }
  } finally {
    await mongoose.disconnect();
  }
}

test();
