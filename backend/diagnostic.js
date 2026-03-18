try {
  console.log("Checking dependencies...");
  require("dotenv").config();
  require("express");
  require("mongoose");
  require("cors");
  console.log("Core dependencies OK.");
  
  const routes = [
    "./routes/auth", "./routes/quiz", "./routes/concept", "./routes/admin",
    "./routes/conceptMap", "./routes/google", "./routes/user", "./routes/remediation",
    "./routes/search", "./routes/chemicalEquation", "./routes/mlRoutes",
    "./routes/learningPath", "./routes/experiments", "./routes/payment",
    "./routes/videos", "./routes/reports", "./routes/revision", "./routes/chat",
    "./routes/cognitive", "./routes/conceptDependency", "./routes/conceptGraph", "./routes/exams"
  ];
  
  routes.forEach(r => {
    try {
      require(r);
      console.log(`Route ${r} OK.`);
    } catch (e) {
      console.error(`Error loading route ${r}:`, e.message);
    }
  });

} catch (e) {
  console.error("Diagnostic failed:", e.message);
}
