const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

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
    console.log(`--- Loading ${r} ---`);
    require(r);
    console.log(`OK: ${r}`);
  } catch (e) {
    console.error(`FAILED: ${r}`);
    console.error(e.stack);
  }
});

console.log("Diagnostic complete.");
