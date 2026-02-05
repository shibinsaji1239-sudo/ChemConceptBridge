const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

/**
 * AI Question Generator Utility
 * Generates chemistry questions (MCQs, Numerical, Assertion-Reason) using Google Gemini API.
 */

const SYSTEM_PROMPT = `
You are an expert Chemistry Teacher specializing in JEE/NEET preparation. 
Your task is to generate high-quality, scientifically accurate chemistry questions.

For each request, generate a mix of:
1. Multiple Choice Questions (MCQs)
2. Numerical Type Problems (presented as MCQs with numerical options)
3. Assertion-Reason Questions (standard 4-option format)

Format your response as a valid JSON array of objects. Each object must follow this structure:
{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0, // Index of the correct option (0-3)
  "explanation": "Detailed explanation of why this option is correct and others are wrong",
  "misconceptionTraps": ["Common mistake 1", "Common mistake 2"]
}

Important Rules:
- All questions must be related to the provided topic and difficulty level.
- Ensure chemical formulas are correctly formatted in text (e.g., H2O, KMnO4).
- Assertion-Reason options should always follow:
  (0) Both Assertion and Reason are true and Reason is the correct explanation of Assertion.
  (1) Both Assertion and Reason are true but Reason is not the correct explanation of Assertion.
  (2) Assertion is true but Reason is false.
  (3) Assertion is false but Reason is true.
- Difficulty levels: Beginner (basic concepts), Intermediate (application-based), Advanced (complex multi-concept JEE/NEET level).
`;

const getSimulatedQuestions = (topic, difficulty, count) => {
    const baseQuestions = [
        {
            question: `Which of the following is a fundamental property of ${topic}?`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correct: 0,
            explanation: "This is a simulated explanation as the AI service is currently at capacity.",
            misconceptionTraps: ["Generic trap 1", "Generic trap 2"]
        },
        {
            question: "Assertion: Chemistry is the study of matter. Reason: Matter is anything that occupies space.",
            options: [
                "Both Assertion and Reason are true and Reason is the correct explanation of Assertion.",
                "Both Assertion and Reason are true but Reason is not the correct explanation of Assertion.",
                "Assertion is true but Reason is false.",
                "Assertion is false but Reason is true."
            ],
            correct: 0,
            explanation: "Simulated Assertion-Reason explanation.",
            misconceptionTraps: ["Confusing Reason with Assertion"]
        },
        {
            question: `What is the standard value associated with ${topic} in ideal conditions?`,
            options: ["1.0", "0.5", "2.0", "None of these"],
            correct: 0,
            explanation: "Simulated numerical explanation.",
            misconceptionTraps: ["Wrong unit conversion"]
        }
    ];

    // Repeat or slice to match count
    let results = [];
    for (let i = 0; i < count; i++) {
        const q = { ...baseQuestions[i % baseQuestions.length] };
        q.question = `[SIMULATED] ${q.question}`;
        results.push(q);
    }
    return results;
};

exports.generateQuestions = async (topic, difficulty, count = 5) => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey.includes("your-api-key")) {
        console.warn("AI Question Generator: Missing or dummy API key.");
        return null;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Find available model (similar to chatController logic)
        let modelName = "gemini-flash-latest"; // Default to a more stable alias
        try {
            console.log("🔍 AI Question Generator: Discovering available models...");
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const { data } = await axios.get(url, { timeout: 4000 });
            const available = (data.models || [])
                .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
                .map(m => m.name.replace("models/", ""));
            
            console.log(`📡 Found ${available.length} available models.`);
            const preferred = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"];
            const found = preferred.find(p => available.includes(p));
            if (found) {
                modelName = found;
            } else if (available.length > 0) {
                modelName = available[0];
            }
        } catch (e) {
            console.warn("⚠️ AI Question Generator: Model discovery failed:", e.message);
        }

        console.log(`🤖 Using model: ${modelName}`);
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Generate ${count} chemistry questions for the topic: "${topic}" with difficulty level: "${difficulty}". 
        Include at least one Assertion-Reason question and one Numerical-based MCQ.`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            systemInstruction: SYSTEM_PROMPT
        });

        const responseText = result.response.text();
        const questions = JSON.parse(responseText);

        if (!Array.isArray(questions)) {
            throw new Error("AI response is not an array");
        }

        return questions;
    } catch (error) {
        console.error("⚠️ AI Question Generation Error:", error.message);
        
        // Fallback to simulation if rate limited or other API errors
        if (error.message.includes("429") || error.message.includes("quota") || error.message.includes("API key")) {
            console.log("🔄 Falling back to simulated questions...");
            return getSimulatedQuestions(topic, difficulty, count);
        }
        
        throw error;
    }
};
