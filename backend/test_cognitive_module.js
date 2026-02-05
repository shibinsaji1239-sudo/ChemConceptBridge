const axios = require('axios');

const API_URL = 'http://localhost:10001/api';

async function testCognitiveModule() {
  try {
    // 1. Create/Login User
    const email = `test_cognitive_${Date.now()}@example.com`;
    const password = 'password123';
    
    console.log(`👤 Creating test user: ${email}`);
    
    let token;
    
    // 1. Register
    try {
      await axios.post(`${API_URL}/auth/register`, {
        name: 'Cognitive Tester',
        email,
        password,
        role: 'student'
      });
      console.log('   Registration successful');
    } catch (e) {
      // Ignore if already exists
      console.log('   Registration skipped (likely exists)');
    }

    // 2. Login (Always required to get token)
    const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
    token = loginRes.data.token;
    
    if (!token) throw new Error("Failed to obtain token");

    const config = { headers: { Authorization: `Bearer ${token}` } };
    const sessionId = `session_${Date.now()}`;

    console.log('✅ User authenticated. Starting Simulation...');
    console.log('--------------------------------------------');

    // Scenario 1: Cognitive Overload
    // Time: 70s, Retries: 3, Clicks: 15
    console.log('\n🧪 SCENARIO 1: Simulating Struggling Student...');
    const overloadPayload = {
      sessionId,
      activityType: 'quiz',
      timeSpent: 70000,
      retryCount: 3,
      clickCount: 15,
      mouseDistance: 5000,
      tabSwitches: 2
    };
    const res1 = await axios.post(`${API_URL}/cognitive/log`, overloadPayload, config);
    console.log(`   Input: Time=70s, Retries=3, Clicks=15`);
    console.log(`   👉 Detected State: ${res1.data.detectedState.toUpperCase()}`);
    console.log(`   (Expected: OVERLOADED)`);

    // Scenario 2: Overconfidence
    // Time: 3s, Retries: 0, Clicks: 1
    console.log('\n🧪 SCENARIO 2: Simulating Rushing Student...');
    const rushPayload = {
      sessionId,
      activityType: 'quiz',
      timeSpent: 3000,
      retryCount: 0,
      clickCount: 1
    };
    const res2 = await axios.post(`${API_URL}/cognitive/log`, rushPayload, config);
    console.log(`   Input: Time=3s, Retries=0`);
    console.log(`   👉 Detected State: ${res2.data.detectedState.toUpperCase()}`);
    console.log(`   (Expected: OVERCONFIDENT)`);

    // Scenario 3: Focused
    // Time: 30s, Retries: 0, Clicks: 3
    console.log('\n🧪 SCENARIO 3: Simulating Focused Student...');
    const focusedPayload = {
      sessionId,
      activityType: 'quiz',
      timeSpent: 30000,
      retryCount: 0,
      clickCount: 3
    };
    const res3 = await axios.post(`${API_URL}/cognitive/log`, focusedPayload, config);
    console.log(`   Input: Time=30s, Retries=0`);
    console.log(`   👉 Detected State: ${res3.data.detectedState.toUpperCase()}`);
    console.log(`   (Expected: FOCUSED)`);
    
    // Check Session Summary
    console.log('\n📊 Fetching Session Analysis...');
    const summary = await axios.get(`${API_URL}/cognitive/session/${sessionId}`, config);
    console.log('   Session Metrics:', summary.data.metrics);

  } catch (err) {
    console.error('❌ Error:', err.response ? err.response.data : err.message);
  }
}

testCognitiveModule();
