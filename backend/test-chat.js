const chatController = require('./controllers/chatController');

const req = {
    body: {
        message: "What is photosynthesis?",
        context: "Biology",
        history: []
    }
};

const res = {
    json: (data) => {
        console.log("Response received:", JSON.stringify(data, null, 2));
    },
    status: (code) => {
        console.log("Status code:", code);
        return res; // chainable
    }
};

console.log("Testing Chat Controller...");
chatController.chat(req, res);
