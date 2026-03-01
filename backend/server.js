// server.js
require("dotenv").config(); // Load environment variables first

const express = require("express");
const mongoose = require("mongoose");
let MongoMemoryServer; // lazy-loaded to avoid dependency when not needed
const cors = require("cors");
const { spawn } = require("child_process"); // ✅ Added for ML model execution

const app = express();

// ====================
// 🔧 Middleware Setup
// ====================
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// ✅ CORS — dynamic origin with credentials; explicit echo for local dev
app.use(
  cors({
    origin: (origin, callback) => {
      // If no Origin header, allow (non-browser clients)
      if (!origin) return callback(null, true);
      // Echo back the exact origin to satisfy credentialed requests
      return callback(null, origin);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204,
  })
);

// ====================
// 📦 Import Routes
// ====================
const authRoutes = require("./routes/auth");
const quizRoutes = require("./routes/quiz");
const conceptRoutes = require("./routes/concept");
const adminRoutes = require("./routes/admin");
const conceptMapRoutes = require("./routes/conceptMap");
const googleRoutes = require("./routes/google");
const userRoutes = require("./routes/user");
const remediationRoutes = require("./routes/remediation");
const searchRoutes = require("./routes/search");
const chemicalEquationRoutes = require("./routes/chemicalEquation");
const mlRoutes = require("./routes/mlRoutes"); // ✅ ML route added
const learningPathRoutes = require("./routes/learningPath");
const experimentRoutes = require("./routes/experiments");
const paymentRoutes = require("./routes/payment");
const videoRoutes = require("./routes/videos");
const reportRoutes = require("./routes/reports");
const revisionRoutes = require("./routes/revision");
const chatRoutes = require("./routes/chat"); // ✅ Chat route added
const cognitiveRoutes = require("./routes/cognitive"); // ✅ Cognitive Load Analyzer
const conceptDependencyRoutes = require("./routes/conceptDependency"); // ✅ Concept Dependency Risk Analyzer
const examRoutes = require("./routes/exams");

// ====================
// 🚏 API Route Mounting
// ====================
app.use("/api/ml", mlRoutes); // ✅ ML Models (KNN, SVM, etc.)
app.use("/api/cognitive", cognitiveRoutes); // ✅ Cognitive Metrics
app.use("/api/concept-dependency", conceptDependencyRoutes); // ✅ Concept Dependency Risk Analyzer
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/concept", conceptRoutes);
app.use("/api/concept-map", conceptMapRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", googleRoutes);
app.use("/api/user", userRoutes);
app.use("/api/remediation", remediationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/chemical-equations", chemicalEquationRoutes);
app.use("/api/learning-path", learningPathRoutes);
app.use("/api/experiments", experimentRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/revision", revisionRoutes);
app.get("/api/test-reports", (req, res) => res.json({ message: "Reports route is reachable" }));
app.use("/api/chat", chatRoutes); // ✅ Chat route mounted
app.use("/api/exams", examRoutes);

// ====================
// 🧠 Health Check Route
// ====================
app.get("/", (req, res) => {
  res.json({ message: "✅ Backend is live and running with ML Integration!" });
});

// ====================
// 🧠 ML Model Test Route (Direct)
// ====================
// This lets you test your Python ML integration without Postman confusion
app.post("/api/ml/predict-performance", (req, res) => {
  try {
    const python = spawn("python", ["./ml/predict.py"]);
    python.stdin.write(JSON.stringify(req.body));
    python.stdin.end();

    let output = "";
    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.on("close", (code) => {
      try {
        const result = JSON.parse(output);
        res.json(result);
      } catch (err) {
        console.error("❌ ML prediction parse error:", err);
        res.status(500).json({ error: "Prediction failed" });
      }
    });
  } catch (err) {
    console.error("❌ ML Python script error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ====================
// 🛢️ MongoDB Connection (with in-memory fallback)
// ====================
const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 5000;
const useInMemory = String(process.env.USE_IN_MEMORY_DB || "false").toLowerCase() === "true";

async function startServer() {
  try {
    if (!mongoURI && !useInMemory) {
      console.error("❌ MONGO_URI not defined in .env file");
      process.exit(1);
    }

    if (mongoURI) {
      await mongoose.connect(mongoURI);
      console.log("✅ MongoDB connected");
    } else if (useInMemory) {
      // Start in-memory MongoDB when no MONGO_URI is provided
      MongoMemoryServer = require("mongodb-memory-server").MongoMemoryServer;
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri);
      console.log("✅ Connected to in-memory MongoDB");
      // Graceful shutdown
      const cleanup = async () => {
        await mongoose.connection.close();
        await mongod.stop();
        process.exit(0);
      };
      process.on("SIGINT", cleanup);
      process.on("SIGTERM", cleanup);
    }

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    // If initial connection failed and fallback is enabled, try memory DB
    if (useInMemory) {
      try {
        console.warn("⚠️ MongoDB connection failed, falling back to in-memory DB:", err.message);
        MongoMemoryServer = require("mongodb-memory-server").MongoMemoryServer;
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        await mongoose.connect(memUri);
        console.log("✅ Connected to in-memory MongoDB");
        app.listen(port, () => {
          console.log(`🚀 Server running on port ${port}`);
        });
        // Graceful shutdown
        const cleanup = async () => {
          await mongoose.connection.close();
          await mongod.stop();
          process.exit(0);
        };
        process.on("SIGINT", cleanup);
        process.on("SIGTERM", cleanup);
        return;
      } catch (fallbackErr) {
        console.error("❌ In-memory MongoDB fallback failed:", fallbackErr.message);
      }
    }
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

startServer();
