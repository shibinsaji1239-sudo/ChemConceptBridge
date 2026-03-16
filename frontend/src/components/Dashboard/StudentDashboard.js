import React, { useState, useEffect } from 'react';
import api from '../../apiClient';
import './StudentDashboard.css';
import ConceptPages from '../Concepts/ConceptPages';
import QuizEngine from '../Quiz/QuizEngine';
import ConceptMap from '../ConceptMap/ConceptMap';
import ProgressTracker from '../Progress/ProgressTracker';
import LearningPath from '../Progress/LearningPath';
import RemediationModule from '../Remediation/RemediationModule';
import GamifiedTracker from '../Gamification/GamifiedTracker';
import Leaderboard from '../Gamification/Leaderboard';
import ConfidenceMeter from '../Progress/ConfidenceMeter';
import PerformanceDashboard from '../Progress/PerformanceDashboard';
import PeriodicTable from '../PeriodicTable/PeriodicTable';
import ChemicalEquations from '../ChemicalEquations/ChemicalEquations';
import ChemistryCalculator from '../ChemistryCalculator/ChemistryCalculator';
import ARMultimediaModule from '../AR/ARMultimediaModule';
import MoleculeAnimation from '../AR/MoleculeAnimation';
import LabSimulation from '../LabSimulation/LabSimulation';
import ChemistrySandbox from '../LabSimulation/ChemistrySandbox';
import ReactionVisualizer from '../ReactionVisualizer/ReactionVisualizer';
import SmartConceptGraph from '../KnowledgeGraph/SmartConceptGraph';
import RevisionModule from '../Revision/RevisionModule';
import SubscriptionModule from './SubscriptionModule';
import KnowledgeGraphVisualizer from '../KnowledgeGraph/KnowledgeGraphVisualizer';
import ConceptDependencyRiskAnalyzer from '../ConceptDependency/ConceptDependencyRiskAnalyzer';
import StudentExamSelector from '../Exams/StudentExamSelector';

const StudentDashboard = ({ activeTab, setActiveTab }) => {
  const [studentStats, setStudentStats] = useState({
    totalQuizzes: 0,
    accuracy: 0,
    conceptsLearned: 0,
    currentStreak: 0,
    xpPoints: 0,
    level: 1,
    dueRevisions: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('student');
  const [selectedLearningTopic, setSelectedLearningTopic] = useState(null);
  const [nextTopics, setNextTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedRole = localStorage.getItem('userRole');
    setUserName(storedName || 'Student');
    setUserRole(storedRole || 'student');

    // Listen for navigation events from child components
    const handleNavigate = (event) => {
      const { tab, topic } = event.detail || {};
      if (tab) {
        setActiveTab(tab);
        if (topic) {
          setSelectedLearningTopic(topic);
        }
      }
    };

    window.addEventListener('navigate-to-tab', handleNavigate);

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, recentRes, pathRes, revisionRes] = await Promise.all([
          api.get('/user/stats').catch(() => ({ data: {} })),
          api.get('/quiz/attempts/student').catch(() => ({ data: [] })),
          api.get('/learning-path').catch(() => ({ data: {} })),
          api.get('/revision/schedule').catch(() => ({ data: { due: [] } }))
        ]);

        const stats = statsRes.data;
        setStudentStats({
          totalQuizzes: stats.totalQuizzes ?? 0,
          accuracy: stats.accuracy ?? 0,
          conceptsLearned: stats.conceptsLearned ?? 0,
          currentStreak: stats.currentStreak ?? 0,
          xpPoints: stats.xpPoints ?? 0,
          level: stats.level ?? 1,
          dueRevisions: revisionRes.data?.due?.length || 0
        });

        const attempts = recentRes.data || [];
        // Limit to 3 most recent attempts
        const recentAttempts = attempts.slice(0, 3);
        const formattedActivity = recentAttempts.map(attempt => ({
          id: attempt._id,
          type: 'quiz',
          title: attempt.quiz?.title || 'Quiz Attempt',
          score: attempt.score || 0,
          date: attempt.completedAt
            ? new Date(attempt.completedAt).toLocaleDateString()
            : attempt.createdAt
              ? new Date(attempt.createdAt).toLocaleDateString()
              : 'Recently',
          topic: attempt.quiz?.topic || 'General'
        }));
        setRecentActivity(formattedActivity);

        const pathData = pathRes.data || {};
        setNextTopics(pathData.weeklyTopics?.slice(0, 3) || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setStudentStats({
          totalQuizzes: 0,
          accuracy: 0,
          conceptsLearned: 0,
          currentStreak: 0,
          xpPoints: 0,
          level: 1
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const onConceptCompleted = () => fetchDashboardData();
    window.addEventListener('concept-completed', onConceptCompleted);

    return () => {
      window.removeEventListener('concept-completed', onConceptCompleted);
      window.removeEventListener('navigate-to-tab', handleNavigate);
    };
  }, []);

  const renderOverview = () => {
    return (
      <div className="teacher-overview fade-in"> {/* Reusing teacher styles for consistency */}
        <div className="overview-header">
          <div className="welcome-section">
            <h1 className="welcome-text">Welcome back, <span className="highlight-text">{userName}</span>!</h1>
            <p className="welcome-subtext">Ready to continue your chemistry journey today?</p>
          </div>
          <div className="quick-stats-row">
            <div className="stat-pill">
              <span className="stat-icon">🔥</span>
              <span className="stat-value">{studentStats.currentStreak} Day Streak</span>
            </div>
            <div className="stat-pill">
              <span className="stat-icon">⭐</span>
              <span className="stat-value">Level {studentStats.level}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Main Stats Card */}
          <div className="dashboard-card main-stats-card">
            <h3 className="card-title">Performance Overview</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-circle" style={{ borderColor: '#6366f1' }}>
                  <span className="stat-number">{studentStats.conceptsLearned}</span>
                </div>
                <span className="stat-label">Concepts Mastered</span>
              </div>
              <div className="stat-item">
                <div className="stat-circle" style={{ borderColor: '#10b981' }}>
                  <span className="stat-number">{studentStats.accuracy}%</span>
                </div>
                <span className="stat-label">Avg. Accuracy</span>
              </div>
              <div className="stat-item">
                <div className="stat-circle" style={{ borderColor: '#f59e0b' }}>
                  <span className="stat-number">{studentStats.xpPoints}</span>
                </div>
                <span className="stat-label">Total XP</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="dashboard-card activity-card">
            <h3 className="card-title">Recent Activity</h3>
            <div className="activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon-bg">
                      {activity.type === 'quiz' ? '📝' : '🧪'}
                    </div>
                    <div className="activity-details">
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-meta">
                        <span>{activity.date}</span>
                        <span>•</span>
                        <span>{activity.score}% accuracy</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">📜</span>
                  <p>No recent activity. Start a module to see progress!</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="dashboard-card actions-card">
            <h3 className="card-title">Next Steps</h3>
            <div className="action-buttons">
              <button onClick={() => setActiveTab('learning-path')} className="action-btn primary">
                <span className="btn-icon">📚</span>
                <span>Continue Learning Path</span>
              </button>
              <button onClick={() => setActiveTab('chemistry-sandbox')} className="action-btn secondary">
                <span className="btn-icon">🧪</span>
                <span>Enter Virtual Lab</span>
              </button>
              <button onClick={() => setActiveTab('quizzes')} className="action-btn tertiary">
                <span className="btn-icon">✍️</span>
                <span>Take a Quiz</span>
              </button>
            </div>
          </div>

          {/* Pending Tasks */}
          {studentStats.dueRevisions > 0 && (
            <div className="dashboard-card alert-card">
              <h3 className="card-title">Attention Needed</h3>
              <div className="alert-content">
                <div className="alert-icon">⏰</div>
                <div className="alert-text">
                  You have <strong>{studentStats.dueRevisions}</strong> topics due for revision. Keep your knowledge fresh!
                </div>
                <button onClick={() => setActiveTab('revision')} className="alert-btn">Review Now</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'concepts':
        return <ConceptPages initialTopic={selectedLearningTopic} />;
      case 'quizzes':
        return <QuizEngine />;
      case 'revision':
        return <RevisionModule />;
      case 'concept-map':
        return <ConceptMap role="student" />;
      case 'smart-graph':
        return <SmartConceptGraph />;
      case 'knowledge-graph':
        return <KnowledgeGraphVisualizer />;
      case 'dependency-risk':
        return <ConceptDependencyRiskAnalyzer mode="student" />;
      case 'progress':
        return <ProgressTracker />;
      case 'learning-path':
        return (
          <LearningPath
            role={userRole}
            onStartTopic={(topic) => {
              setSelectedLearningTopic(topic);
              setActiveTab('concepts');
            }}
          />
        );
      case 'exams':
        return (
          <div className="dashboard-card">
            <h3>Scheduled Exams</h3>
            <div style={{ paddingTop: 8 }}>
              <StudentExamSelector />
            </div>
          </div>
        );
      case 'remediation':
        return <RemediationModule />;
      case 'confidence':
        return <ConfidenceMeter />;
      case 'ar-multimedia':
        return <ARMultimediaModule />;
      case 'molecule-animation':
        return <MoleculeAnimation />;
      case 'lab-simulation':
      case 'chemistry-sandbox':
        return <LabSimulation role="student" />;
      case 'reaction-visualizer':
        return <ReactionVisualizer />;
      case 'chemical-equations':
        return <ChemicalEquations />;
      case 'chemistry-calculator':
        return <ChemistryCalculator />;
      case 'gamification':
        return <Leaderboard />;
      case 'performance-dashboard':
        return <PerformanceDashboard />;
      case 'subscription':
        return <SubscriptionModule />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="student-dashboard-layout">
      <div className="student-dashboard-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default StudentDashboard;
