# ChemConcept Bridge

An AI-powered chemistry learning platform that bridges the gap between abstract chemistry concepts and student understanding. The platform uses adaptive quizzes, misconception detection, visual simulations, and personalized remediation to make learning interactive, engaging, and exam-ready.

## 🚀 Features Implemented (95% Complete)

### ✅ Core & Advanced Features
- **Professional Dashboard System** - Role-based navigation for Students, Teachers, and Admins.
- **9-Module Standardized Taxonomy** - Internal system classification for all functional areas.
- **Adaptive Quiz Engine** - MCQ-based quizzes with AI-driven misconception detection.
- **Smart Knowledge Graph** - Visual mapping of concept relationships and dependencies.
- **Virtual Lab Sandbox** - Interactive simulation environment for virtual experiments.
- **Gamification System** - XP progression, leveling, and achievement badges.
- **AR & Multimedia** - Augmented reality visualizations and 3D molecular animations.
- **AI-Powered Remediation** - Personalized corrective content via AI Advisor.
- **Advanced Analytics** - Student performance prediction and risk analysis.

### 🧪 Educational Modules (Modules 1-9)
1. **Login & Security** - User authentication and session management.
2. **Registration** - Profile creation and role onboarding.
3. **Concept Library** - Interactive content for Acids, Bases, Periodic Table, etc.
4. **Quiz Engine** - Automated scoring and feedback system.
5. **Misconception Detection** - Identifying specific learning gaps.
6. **ML Performance Prediction** - Forecasting student success categories.
7. **Exams Module** - Formative assessment and formal results tracking.
8. **Subscription & Payments** - Membership tiers with Razorpay integration.
9. **Visual Learning** - Progress-tracked video library and 3D visualizations.

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern functional components with hooks.
- **React Router** - Client-side routing.
- **3Dmol.js** - High-performance 3D molecular visualization.
- **React DND** - Drag-and-drop for Concept Mapping and Smart Graphs.
- **Formik + Yup** - Robust form handling and validation.

### Backend
- **Node.js + Express.js** - Scalable server architecture.
- **MongoDB + Mongoose** - Document-based data modeling.
- **Google Generative AI** - Powering the AI Remediation Advisor.
- **JWT + Google OAuth** - Multi-method secure authentication.
- **Razorpay** - Integrated payment gateway.

### Machine Learning
- **Python-based Suite** - KNN, Naive Bayes, Decision Tree, SVM, and Neural Networks.
- **Data Analytics** - scikit-learn, pandas, numpy, and matplotlib.

## 📁 Project Structure (Key Directories)

```
chemconcept-bridge/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AR/                 # AR & Multimedia Modules
│   │   │   ├── ConceptDependency/  # Dependency Risk Analyzer
│   │   │   ├── Gamification/       # XP & Badge System
│   │   │   ├── KnowledgeGraph/     # Smart Graphs & Knowledge Maps
│   │   │   ├── LabSimulation/      # Virtual Lab Sandbox
│   │   │   ├── MoleculeAnimation/  # 3D Molecular Graphics
│   │   │   └── Remediation/        # AI Intervention Module
│   │   └── pages/                  # Unified Module Dashboards
└── backend/
    ├── ml/                         # ML Model Training & Datasets
    ├── models/                     # Multi-schema Data Architecture
    └── routes/                     # Standardized API Endpoints
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation & Run
1. `cd frontend && npm install`
2. `cd backend && npm install`
3. Configure `.env` in the backend directory.
4. Start servers: `npm start` in both directories (or use `start-servers.bat`).

## 📊 Current Progress

- ✅ **Core Modules (1-4)**: 100%
- ✅ **Advanced Modules (5-9)**: 90%
- ✅ **Specialized Tools (Lab, AR, AI)**: 85%
- ✅ **ML Suites**: 100% (All 5 models trained and evaluated)

## 🚀 Next Steps (Optimization Phase)

1. **Content Expansion**: Populate Chemical Bonding and Thermodynamics interactive content.
2. **AI Refinement**: Enhance AI Advisor's conversational memory.
3. **UX Polish**: Optimize 3Dmol rendering for mobile viewports.
4. **Testing**: Expand Playwright test suite to cover multi-stage user journeys.

---
**ChemConcept Bridge** - Redefining Chemistry Learning with AI and Visualization. 🧪✨
