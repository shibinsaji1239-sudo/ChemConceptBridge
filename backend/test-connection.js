const axios = require('axios');

async function testChat() {
    console.log("--- Testing Chat API ---");
    
    // Test GET /api/chat/test
    try {
        console.log("1. GET http://localhost:10000/api/chat/test");
        const resTest = await axios.get('http://localhost:10000/api/chat/test');
        console.log("   Success:", resTest.data);
    } catch (error) {
        console.error("   Failed:", error.message, error.response?.status);
    }

    // Test POST /api/chat/message
    try {
        console.log("2. POST http://localhost:10000/api/chat/message");
        const response = await axios.post('http://localhost:10000/api/chat/message', {
            message: "Hello",
            history: []
        });
        console.log("   Success! Response:", response.data);
    } catch (error) {
        console.error("   Failed:", error.message);
        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Data:", error.response.data);
        }
    }
}

testChat();
