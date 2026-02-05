const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const path = require("path");
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Using API Key:", apiKey ? "Detected" : "Missing");
    
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const { data } = await axios.get(url);
        console.log("Available Models:");
        data.models.forEach(m => {
            if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${m.name} (${m.displayName})`);
            }
        });
    } catch (e) {
        console.error("Error listing models:", e.message);
    }
}

listModels();
