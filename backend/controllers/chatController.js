const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const SYSTEM_INSTRUCTION = `
You are an AI Doubt Resolution Chatbot (Context-Aware Tutor) for a Chemistry education platform (ChemConceptBridge).
First give a direct, precise answer to the user's question. Then provide a brief step-by-step explanation or key points.
Identify potential misunderstanding patterns if the user asks confused questions.
You are trained on NCERT/chemistry concepts.

If the user provides a "context" (e.g., a specific topic they are studying), tailor your answer to that topic.
If the question is not related to chemistry or science, politely guide them back to the topic.
Keep answers concise, precise, and educational. Prefer NCERT-style definitions when relevant.
Use Markdown formatting for chemical formulas (e.g., H_2O, CO_2) and equations.
`;

// Helper to generate simulated chemistry responses when API key is missing/invalid
const getSimulatedResponse = (message, context) => {
    const msg = (message || "").toLowerCase();
    const ctx = (context || "").toLowerCase();
    if (msg.includes("base") && !msg.includes("acid")) {
        return "Bases are substances that produce hydroxide ions (OH−) in aqueous solution or accept protons (H+). Strong bases (e.g., NaOH, KOH) dissociate completely; weak bases (e.g., NH3) partially.";
    }
    if (msg.includes("acid") || msg.includes("ph") || ctx.includes("acid")) {
        return "Acids are substances that produce hydrogen ions (H+) in aqueous solution or donate protons. Strong acids (e.g., HCl, HNO3) ionize completely; weak acids (e.g., CH3COOH) partially.";
    }
    if (msg.includes("salt") || ctx.includes("salt")) {
        return "Salts form when acids react with bases (neutralization). Example: HCl + NaOH → NaCl + H2O. Salts can be acidic, basic, or neutral depending on their ions.";
    }
    if (msg.includes("indicator") || msg.includes("titration") || ctx.includes("titration")) {
        return "Titration measures concentration using a known solution. Indicators change color near the equivalence point. Example: Using phenolphthalein in acid–base titration.";
    }
    if (msg.includes("periodic") || msg.includes("trend") || msg.includes("atomic radius") || msg.includes("ionization") || ctx.includes("periodic")) {
        return "Periodic trends: atomic radius decreases across a period and increases down a group; ionization energy shows the opposite trend; electronegativity follows ionization energy patterns.";
    }
    if (msg.includes("atom") || msg.includes("structure") || msg.includes("electron") || ctx.includes("atomic")) {
        return "Atoms have a nucleus (protons, neutrons) with electrons in shells and subshells (s, p, d, f). Electron configuration follows the Aufbau principle, Pauli exclusion, and Hund’s rule.";
    }
    if (msg.includes("bond") || msg.includes("ionic") || msg.includes("covalent") || msg.includes("metallic") || ctx.includes("bonding")) {
        return "Ionic bonds involve electron transfer creating ions; covalent bonds share electrons; metallic bonds feature delocalized electrons. Polarity depends on electronegativity difference and geometry.";
    }
    if (msg.includes("stoichiometry") || msg.includes("mole") || msg.includes("molar mass") || ctx.includes("mole")) {
        return "Stoichiometry uses mole ratios from balanced equations. 1 mole = 6.022×10^23 particles. Convert grams ↔ moles using molar mass; use coefficients to find product/reactant amounts.";
    }
    if (msg.includes("gas") || msg.includes("boyle") || msg.includes("charles") || msg.includes("ideal") || ctx.includes("gas")) {
        return "Gas laws: Boyle (P∝1/V), Charles (V∝T), and Ideal PV=nRT. Real gases deviate at high pressure/low temperature. Use Kelvin for temperature in calculations.";
    }
    if (msg.includes("solution") || msg.includes("molarity") || msg.includes("molality") || msg.includes("solubility") || ctx.includes("solution")) {
        return "Solutions: concentration by molarity (mol/L) or molality (mol/kg). Solubility depends on temperature and the nature of solute/solvent. ‘Like dissolves like’.";
    }
    if (msg.includes("thermo") || msg.includes("enthalpy") || msg.includes("entropy") || msg.includes("gibbs") || ctx.includes("thermodynamics")) {
        return "Thermodynamics: ΔH is heat change, ΔS is disorder. Gibbs free energy ΔG=ΔH−TΔS; ΔG<0 indicates spontaneity under given conditions.";
    }
    if (msg.includes("equilibrium") || msg.includes("le chatelier") || msg.includes("k\u2019") || ctx.includes("equilibrium")) {
        return "Chemical equilibrium occurs when forward and reverse rates are equal. The equilibrium constant K depends on temperature. Le Chatelier’s principle predicts shift under stress.";
    }
    if (msg.includes("rate") || msg.includes("kinetics") || msg.includes("activation") || msg.includes("catalyst") || ctx.includes("kinetics")) {
        return "Reaction rate depends on concentration, temperature, and catalysts. Activation energy is the barrier to reaction; catalysts lower this barrier without being consumed.";
    }
    if (msg.includes("redox") || msg.includes("oxidation") || msg.includes("reduction") || msg.includes("electrochemistry") || ctx.includes("electrochemistry")) {
        return "Redox: oxidation loses electrons, reduction gains. Electrochemical cells convert chemical energy to electrical; cell potential relates to reaction spontaneity.";
    }
    if (msg.includes("organic") || msg.includes("hydrocarbon") || msg.includes("alkane") || msg.includes("alkene") || msg.includes("alcohol") || msg.includes("ketone") || ctx.includes("organic")) {
        return "Organic chemistry studies carbon compounds: alkanes (single bonds), alkenes (double bonds), alkynes (triple). Functional groups like alcohols, aldehydes, ketones define reactivity.";
    }
    if (msg.includes("states") && msg.includes("matter") || (msg.includes("solid") && msg.includes("liquid") && msg.includes("gas"))) {
        return "The three main states of matter are **Solid** (fixed shape & volume), **Liquid** (fixed volume, takes container shape), and **Gas** (no fixed shape or volume). Plasma is the fourth state (ionized gas).";
    }
    if (msg.includes("solid") || ctx.includes("solid")) {
        return "Solids have fixed shape and volume due to closely packed particles with strong intermolecular forces. Particles vibrate about fixed positions; diffusion is negligible.";
    }
    if (msg.includes("liquid") || ctx.includes("liquid")) {
        return "Liquids have fixed volume but take the shape of the container. Intermolecular forces are moderate; particles can flow and diffuse faster than in solids.";
    }
    if (msg.includes("gas") || ctx.includes("gas")) {
        return "Gases have neither fixed volume nor shape, expanding to fill their container. Particles move randomly at high speeds with negligible intermolecular forces.";
    }
    if (msg.includes("matter") || msg.includes("substance") || ctx.includes("matter")) {
        return "Matter is anything that has mass and occupies space. It consists of atoms and molecules and exists primarily as solids, liquids, or gases depending on temperature and pressure.";
    }
    if (msg.includes("reaction") || msg.includes("equation") || ctx.includes("reaction")) {
        return "A chemical reaction rearranges atoms to form new substances. Reactants → Products. Reactions must balance mass and charge (Law of Conservation of Mass).";
    }
    if (msg.includes("element") || msg.includes("compound") || msg.includes("mixture")) {
        return "Elements consist of one type of atom (e.g., O2, Fe). Compounds are chemically bonded elements (e.g., H2O). Mixtures are physically combined substances (e.g., Air, Alloys).";
    }
    
    // Generic Fallback that attempts to define the topic
    const topic = msg.replace("what is", "").replace("define", "").replace("explain", "").replace("tell me about", "").trim();
    return `I'm currently in **offline/simulated mode** due to high traffic. \n\n**Quick Definition for "${topic || "your topic"}":**\nIn chemistry, this concept typically relates to the properties, composition, or changes of matter. \n\n*Please ask about Acids, Bases, Solids, Liquids, Gases, Reactions, or Periodic Trends for a specific definition.*`;
};

exports.chat = async (req, res) => {
    console.log("🤖 Chat Controller: Handling message...");
    
    // Define fallback variables outside try to be safe for catch block
    let safeMessage = "your question";
    let safeContext = "General Chemistry";

    try {
        if (!req.body) {
            console.error("❌ Chat Controller: Missing req.body");
            return res.status(200).json({ 
                response: "⚠️ **System Error**: Request body is missing. Please contact support." 
            });
        }
        
        const { message, context, history } = req.body;
        safeMessage = message || safeMessage;
        safeContext = context || safeContext;
        
        console.log(`📩 Message: "${safeMessage}", Context: "${safeContext}"`);

        if (!safeMessage || typeof safeMessage !== 'string' || safeMessage.trim() === "") {
             console.error("❌ Chat Controller: Empty or invalid message");
             return res.status(200).json({ 
                response: "⚠️ **System Error**: A valid message is required." 
            });
        }

        const cleanMessage = safeMessage.trim();

        // Check if key is missing OR obviously incorrect
        const apiKey = process.env.GEMINI_API_KEY;
        console.log("🔑 GEMINI_API_KEY detected:", apiKey ? `${apiKey.slice(0, 5)}... (len=${apiKey.length})` : "<undefined>");
        const isDummyKey = apiKey && (apiKey.startsWith("gen-lang-client") || apiKey.includes("your-api-key"));

        if (!apiKey || apiKey.trim() === "" || isDummyKey) {
             console.warn("GEMINI_API_KEY is missing or invalid in .env");
            return res.json({ 
                response: "⚠️ **AI Configuration Missing**: Please add a valid `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/) to your backend `.env` file.\n\n" +
                          "**Simulated Response:**\n" + getSimulatedResponse(cleanMessage, safeContext)
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        let candidateModels = [];
        const preferredOrder = [
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-1.5-pro",
            "models/gemini-1.5-flash"
        ];
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const { data } = await axios.get(url, { timeout: 4000 });
            const available = (data.models || []).filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent")).map(m => m.name);
            candidateModels = preferredOrder.filter(p => available.includes(p)).map(n => n.replace("models/", ""));
        } catch (e) {
            candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"];        
        }

        // Format history for Gemini
        let validHistory = [];
        if (Array.isArray(history) && history.length > 0) {
            const mappedHistory = history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: (h.content || h.text || "").toString() }]
            })).filter(h => h.parts[0].text.trim() !== "");

            let firstUserIndex = mappedHistory.findIndex(h => h.role === 'user');
            if (firstUserIndex !== -1) {
                const alternatingHistory = [];
                const subset = mappedHistory.slice(firstUserIndex);
                for (let i = 0; i < subset.length; i++) {
                    if (alternatingHistory.length > 0 && alternatingHistory[alternatingHistory.length - 1].role === subset[i].role) {
                        alternatingHistory[alternatingHistory.length - 1] = subset[i];
                    } else {
                        alternatingHistory.push(subset[i]);
                    }
                }

                if (alternatingHistory.length > 0 && alternatingHistory[alternatingHistory.length - 1].role === 'user') {
                    alternatingHistory.pop();
                }

                validHistory = alternatingHistory;
            }
        }

        console.log("📤 Initializing Chat with validHistory length:", validHistory.length);
        const chatOptions = validHistory.length > 0 ? { history: validHistory } : {};
        const prompt = safeContext ? `[Current Study Topic: ${safeContext}] Student Question: ${cleanMessage}` : cleanMessage;
        console.log("📨 Sending Message to Gemini...");
        let finalResponseText;
        let sent = false;
        let rateLimited = false;
        for (const m of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({ model: m, systemInstruction: SYSTEM_INSTRUCTION });
                const chat = model.startChat(chatOptions);
                const result = await chat.sendMessage(prompt);
                const response = await result.response;
                finalResponseText = response.text();
                sent = true;
                console.log("📥 Received response from:", m);
                break;
            } catch (geminiError) {
                const msg = geminiError?.message || "";
                if (msg.includes("429") || msg.toLowerCase().includes("too many requests")) {
                    rateLimited = true;
                }
                if (!(msg.includes("404") || msg.includes("NOT_FOUND"))) {
                    console.error("⚠️ Gemini API Call Failed:", msg);
                    break;
                }
            }
        }
        if (!sent) {
            finalResponseText = getSimulatedResponse(cleanMessage, safeContext);
        }

        res.json({ response: finalResponseText });

    } catch (error) {
        console.error("🔥 CRITICAL Chat Controller Error:", error);
        
        const errorMsg = error.message || "";
        const isApiKeyError = errorMsg.includes("API key not valid") || 
                              errorMsg.includes("API_KEY_INVALID") ||
                              errorMsg.includes("403");

        const simulatedResponse = getSimulatedResponse(safeMessage);

        if (isApiKeyError) {
            return res.status(200).json({ 
                response: "⚠️ **Invalid API Key**: The `GEMINI_API_KEY` in your `.env` file seems incorrect or unauthorized.\n\n" +
                          "**Simulated Response:**\n" + simulatedResponse
            });
        }

        res.status(200).json({ 
            response: "I'm currently experiencing some technical difficulties with my AI engine. " +
                      "Please check your server connection or API configuration. \n\n" +
                      "**Simulated Response:**\n" + simulatedResponse
        });
    }
};
