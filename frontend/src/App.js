import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SubscriptionPage from './pages/SubscriptionPage';
import GamificationPage from './pages/GamificationPage';
import MLModelsPage from './pages/MLModelsPage';
import ModuleDashboardsPage from './pages/ModuleDashboardsPage';
import ExperimentsPage from './pages/ExperimentsPage';
import LabRunPage from './pages/LabRunPage';
import TeacherAttemptsPage from './pages/TeacherAttemptsPage';
import AdminExperimentsPage from './pages/AdminExperimentsPage';
import ExperimentEditorPage from './pages/ExperimentEditorPage';
import VideosPage from './pages/VideosPage';
import QuizStatsPage from './pages/QuizStatsPage';
import StudentProgressPage from './pages/StudentProgressPage';
import CalculatorPage from './pages/CalculatorPage';

// Components
import Dashboard from './components/Dashboard/Dashboard';
import PerformanceDashboard from './components/Progress/PerformanceDashboard';
import ConceptPages from './components/Concepts/ConceptPages';
import ConceptMap from './components/ConceptMap/ConceptMap';
import QuizEngine from './components/Quiz/QuizEngine';
import Chatbot from './components/Chatbot/Chatbot'; // ✅ Import Chatbot

// Protected route component
const ProtectedRoute = ({ element, allowedRole }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Allow "any" role to access
    if (allowedRole === 'any') {
      return element;
    }

    const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

    // If user's role is allowed, render element
    if (allowed.includes(payload.role)) return element;

    // Otherwise redirect to their dashboard
    if (payload.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />;
    if (payload.role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (payload.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/login" replace />;
  } catch (error) {
    console.error('Error decoding token:', error);
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

function App() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and get their role
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT token to get user role
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="text-xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ToastContainer 
        position="top-right" 
        autoClose={5000} 
        hideProgressBar={false} 
        newestOnTop 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
      />
      <div className="app-container min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage user={userRole} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/subscription" element={<SubscriptionPage user={userRole} isStandalone={true} />} />
          <Route path="/test-dashboards" element={<ModuleDashboardsPage />} />

          {/* Dashboard Routes */}
          <Route 
            path="/dashboard" 
            element={
              <Navigate 
                to={
                  userRole === 'admin' ? '/admin-dashboard' : 
                  userRole === 'teacher' ? '/teacher-dashboard' : 
                  '/student-dashboard'
                } 
                replace 
              />
            } 
          />
          <Route path="/admin-dashboard" element={<ProtectedRoute element={<Dashboard />} allowedRole="admin" />} />
          <Route path="/teacher-dashboard" element={<ProtectedRoute element={<Dashboard />} allowedRole="teacher" />} />
          <Route path="/student-dashboard" element={<ProtectedRoute element={<Dashboard />} allowedRole="student" />} />

          {/* Feature Routes (Protected) */}
          <Route path="/concepts" element={<ProtectedRoute element={<ConceptPages />} allowedRole="any" />} />
          <Route path="/concept-map" element={<ProtectedRoute element={<ConceptMap role={userRole} />} allowedRole="any" />} />
          <Route path="/quiz-engine" element={<ProtectedRoute element={<QuizEngine />} allowedRole="any" />} />
          <Route path="/gamification" element={<ProtectedRoute element={<GamificationPage />} allowedRole="any" />} />
          <Route path="/ml" element={<ProtectedRoute element={<MLModelsPage />} allowedRole="any" />} />
          <Route path="/performance" element={<PerformanceDashboard />} />

          {/* Virtual Lab Routes */}
          <Route path="/experiments" element={<ProtectedRoute element={<ExperimentsPage />} allowedRole="any" />} />
          <Route path="/experiments/:id" element={<ProtectedRoute element={<LabRunPage />} allowedRole="any" />} />
          <Route path="/videos" element={<ProtectedRoute element={<VideosPage />} allowedRole="any" />} />
          <Route path="/experiments/:id/attempts" element={<ProtectedRoute element={<TeacherAttemptsPage />} allowedRole={['teacher','admin']} />} />
          <Route path="/calculator" element={<ProtectedRoute element={<CalculatorPage />} allowedRole="any" />} />

          {/* Admin experiment management */}
          <Route path="/admin/experiments" element={<ProtectedRoute element={<AdminExperimentsPage />} allowedRole={["admin"]} />} />
          <Route path="/admin/experiments/new" element={<ProtectedRoute element={<ExperimentEditorPage />} allowedRole={["admin"]} />} />
          <Route path="/admin/experiments/:id/edit" element={<ProtectedRoute element={<ExperimentEditorPage />} allowedRole={["admin"]} />} />

          {/* Specific Feature Routes */}
          <Route path="/quiz/:quizId/stats" element={<ProtectedRoute element={<QuizStatsPage />} allowedRole="teacher" />} />
          <Route path="/student/:studentId/progress" element={<ProtectedRoute element={<StudentProgressPage />} allowedRole="teacher" />} />
          
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Chatbot /> {/* ✅ Chatbot Component */}
    </Router>
  );
}

export default App;

