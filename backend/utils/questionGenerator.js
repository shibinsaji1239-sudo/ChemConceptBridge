const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

/**
 * AI Question Generator Utility
 * Generates high-quality chemistry questions using Gemini or a robust fallback bank.
 */

const SYSTEM_PROMPT = `
You are a Senior Chemistry Professor specializing in JEE Advanced and NEET competitive exams. 
Your goal is to generate extremely high-quality, scientifically accurate, and challenging questions.

For each request, provide a varied mix:
1. Multiple Choice Questions (MCQs) - conceptual and application-based.
2. Numerical Problems - where calculations are required to find the correct option.
3. Assertion-Reason - checking deep conceptual understanding.

Response Format (Strict JSON Array):
[
  {
    "question": "Deep conceptual question with correct chemical notation (e.g., ΔH, [Fe(CN)6]4-)",
    "options": ["Correct Option", "Distractor 1", "Distractor 2", "Distractor 3"],
    "correct": 0,
    "explanation": "A Master-level explanation covering the underlying principle and why other options are incorrect.",
    "misconceptionTraps": ["Reason for common error", "Common formula misuse"]
  }
]

Difficulty Guidelines:
- Beginner: Fundamental definitions and simple unit conversions.
- Intermediate: Multi-step problems and direct applications of laws.
- Advanced: JEE Advanced/NEET level. Integrated concepts (e.g., combining Thermodynamics with Kinetics). Use graphs or complex reaction mechanisms in descriptions.
`;

// Robust Fallback Bank for Common Topics
const FALLBACK_BANK = {
    "Chemical Kinetics": [
        {
            question: "For a first-order reaction A → B, the rate constant is 0.01 s⁻¹. If the initial concentration of A is 1.0 M, what is the rate of reaction after 100 seconds?",
            options: ["0.0037 M/s", "0.01 M/s", "0.001 M/s", "0.005 M/s"],
            correct: 0,
            explanation: "After 100s, [A] = [A]₀ * e^(-kt). [A] = 1.0 * e^(-0.01 * 100) = e⁻¹ ≈ 0.368 M. Rate = k[A] = 0.01 * 0.368 = 0.00368 M/s.",
            misconceptionTraps: ["Using initial rate instead of instantaneous rate", "Incorrect integration formula"]
        },
        {
            question: "Assertion: The rate of a reaction always increases with an increase in temperature. Reason: The number of effective collisions increases according to the Arrhenius equation.",
            options: [
                "Both Assertion and Reason are true and Reason is the correct explanation of Assertion.",
                "Both Assertion and Reason are true but Reason is not the correct explanation of Assertion.",
                "Assertion is true but Reason is false.",
                "Assertion is false but Reason is true."
            ],
            correct: 0,
            explanation: "Temperature increases the kinetic energy of molecules, increasing the fraction of molecules with energy ≥ activation energy (Ea).",
            misconceptionTraps: ["Thinking all collisions lead to reaction"]
        },
        {
            question: "In the reaction 2A + B → C, if the concentration of A is doubled and B is halved, the rate remains unchanged. What is the order of reaction with respect to A and B?",
            options: ["A: 1, B: 2", "A: 2, B: 1", "A: 0.5, B: 2", "A: 1, B: 1"],
            correct: 0,
            explanation: "Rate = k[A]^x [B]^y. If [A] becomes 2[A] and [B] becomes 0.5[B], new rate R' = k(2[A])^x (0.5[B])^y = R * 2^x * 0.5^y. 2^x * 0.5^y = 1 implies x=1, y=2 (or other ratios, but 1,2 is standard).",
            misconceptionTraps: ["Assuming stoichiometric coefficients as orders"]
        }
    ],
    "Organic Chemistry": [
        {
            question: "Which of the following carbocations is the most stable?",
            options: ["Triphenylmethyl carbocation", "Tert-butyl carbocation", "Benzyl carbocation", "Isopropyl carbocation"],
            correct: 0,
            explanation: "The triphenylmethyl carbocation is highly stabilized by resonance across three benzene rings.",
            misconceptionTraps: ["Overestimating inductive effect vs resonance"]
        }
    ],
    "Atomic Structure": [
        {
            question: "What is the maximum number of electrons that can be accommodated in a subshell with l = 3?",
            options: ["14", "10", "6", "2"],
            correct: 0,
            explanation: "For l=3 (f-subshell), use formula 2(2l + 1) = 2(2*3 + 1) = 14.",
            misconceptionTraps: ["Confusing l with n", "Forgetting the factor of 2 for spin"]
        }
    ]
};

const getSimulatedQuestions = (topic, difficulty, count) => {
    // Try to find specific topic in bank
    const topicKey = Object.keys(FALLBACK_BANK).find(k =>
        topic.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(topic.toLowerCase())
    );

    const bank = topicKey ? FALLBACK_BANK[topicKey] : FALLBACK_BANK["Chemical Kinetics"]; // Default to Kinetics if unknown

    let results = [];
    for (let i = 0; i < count; i++) {
        const q = { ...bank[i % bank.length] };
        results.push(q);
    }
    return results;
};

exports.generateQuestions = async (topic, difficulty, count = 5) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes("your-api-key")) {
        console.warn("AI Question Generator: Missing API key. Using Fallback Bank.");
        return getSimulatedQuestions(topic, difficulty, count);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        let modelName = "gemini-1.5-flash"; // Use stable 1.5 flash
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const { data } = await axios.get(url, { timeout: 3000 });
            const available = (data.models || []).map(m => m.name.replace("models/", ""));
            const preferred = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
            modelName = preferred.find(p => available.includes(p)) || "gemini-1.5-flash";
        } catch (e) {
            console.warn("AI Question Generator: Model discovery failed, using default.");
        }

        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Generate ${count} high-level chemistry questions for the topic: "${topic}" with difficulty level: "${difficulty}". 
        The questions should be targeting JEE Advanced/NEET level candidates. Ensure correct chemical formulas and detailed logical explanations.`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            systemInstruction: SYSTEM_PROMPT
        });

        const responseText = result.response.text();
        const questions = JSON.parse(responseText);

        if (!Array.isArray(questions)) throw new Error("Invalid format");
        return questions;

    } catch (error) {
        console.error("⚠️ AI Generation Error:", error.message);
        return getSimulatedQuestions(topic, difficulty, count);
    }
};
