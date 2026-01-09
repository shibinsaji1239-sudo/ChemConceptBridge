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
import ARMultimediaModule from '../ARMultimedia/ARMultimediaModule';
import SubscriptionModule from './SubscriptionModule';
import KnowledgeGraphVisualizer from '../KnowledgeGraph/KnowledgeGraphVisualizer';

const StudentDashboard = ({ activeTab, setActiveTab }) => {
  const [studentStats, setStudentStats] = useState({
    totalQuizzes: 0,
    accuracy: 0,
    conceptsLearned: 0,
    currentStreak: 0,
    xpPoints: 0,
    level: 1
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [userName, setUserName] = useState('');
  const [selectedLearningTopic, setSelectedLearningTopic] = useState(null);
  const [nextTopics, setNextTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    setUserName(storedName || 'Student');

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
        const [statsRes, recentRes, pathRes] = await Promise.all([
          api.get('/user/stats').catch(() => ({ data: {} })),
          api.get('/quiz/attempts/student').catch(() => ({ data: [] })),
          api.get('/learning-path').catch(() => ({ data: {} }))
        ]);

        const stats = statsRes.data;
        setStudentStats({
          totalQuizzes: stats.totalQuizzes ?? 0,
          accuracy: stats.accuracy ?? 0,
          conceptsLearned: stats.conceptsLearned ?? 0,
          currentStreak: stats.currentStreak ?? 0,
          xpPoints: stats.xpPoints ?? 0,
          level: stats.level ?? 1
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
    const progress = [
      { label: 'Acids & Bases', value: 75 },
      { label: 'Periodic Table', value: 60 },
      { label: 'Chemical Bonding', value: 40 },
      { label: 'Thermodynamics', value: 20 },
    ];

    return (
      <div className="student-home">
        <div className="student-hero">
          <div>
            <div className="student-hero-greeting">Welcome back, {userName}!</div>
            <div className="student-hero-subtitle">Ready to explore chemistry today?</div>
          </div>
          <button
            className="upgrade-btn"
            onClick={() => setActiveTab('subscription')}
          >
            Upgrade Plan
          </button>
        </div>

        <div className="learning-progress-card">
          <div className="lp-header">
            <div className="lp-title">Learning Progress</div>
            <div className="lp-subtitle">Your progress across different chemistry concepts</div>
          </div>
          <div className="lp-tracks">
            {progress.map((item) => (
              <div key={item.label} className="lp-row">
                <div className="lp-row-header">
                  <span className="lp-row-label">{item.label}</span>
                  <span className="lp-row-value">{item.value}%</span>
                </div>
                <div className="lp-bar">
                  <div className="lp-bar-fill" style={{ width: `${item.value}%` }} />
                </div>
                <button
                  className="lp-cta"
                  onClick={() => setActiveTab('concepts')}
                >
                  Continue
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="student-feature-grid">
          <button className="feature-card" onClick={() => setActiveTab('concepts')}>
            <div className="feature-icon blue">📘</div>
            <div className="feature-title">Study Notes</div>
            <div className="feature-sub">Access comprehensive chemistry concepts</div>
          </button>
          <button className="feature-card" onClick={() => setActiveTab('concept-map')}>
            <div className="feature-icon green">🧠</div>
            <div className="feature-title">Concept Mapping</div>
            <div className="feature-sub">Build connections between topics</div>
          </button>
          <button className="feature-card" onClick={() => setActiveTab('knowledge-graph')}>
            <div className="feature-icon teal">🗺️</div>
            <div className="feature-title">Knowledge Graph</div>
            <div className="feature-sub">Visualize concept relationships</div>
          </button>
          <button className="feature-card" onClick={() => setActiveTab('quizzes')}>
            <div className="feature-icon purple">🧪</div>
            <div className="feature-title">Take Quiz</div>
            <div className="feature-sub">Test your understanding</div>
          </button>
          <button className="feature-card" onClick={() => setActiveTab('learning-path')}>
            <div className="feature-icon red">🛣️</div>
            <div className="feature-title">Learning Path</div>
            <div className="feature-sub">AI-generated roadmap for you</div>
          </button>
          <button className="feature-card" onClick={() => setActiveTab('performance-dashboard')}>
            <div className="feature-icon orange">📈</div>
            <div className="feature-title">Performance</div>
            <div className="feature-sub">Track your progress</div>
          </button>
          <button className="feature-card" onClick={() => setActiveTab('gamification')}>
            <div className="feature-icon gold">🏆</div>
            <div className="feature-title">Achievements</div>
            <div className="feature-sub">View badges and leaderboard</div>
          </button>
        </div>

        <div className="recent-activity-card">
          <div className="ra-header">
            <div>
              <div className="ra-title">Recent Activity</div>
              <div className="ra-subtitle">Your latest learning sessions</div>
            </div>
          </div>
          <div className="ra-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="ra-item quiz">
                  <div className="ra-icon">🧪</div>
                  <div className="ra-content">
                    <div className="ra-main">
                      <div className="ra-label">{activity.title}</div>
                      <span className="ra-pill success">Passed</span>
                    </div>
                    <div className="ra-meta">
                      <span>Scored {activity.score}%</span>
                      <span>•</span>
                      <span>{activity.date}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="ra-item quiz">
                  <div className="ra-icon">🧪</div>
                  <div className="ra-content">
                    <div className="ra-main">
                      <div className="ra-label">Acids & Bases Quiz</div>
                      <span className="ra-pill success">Passed</span>
                    </div>
                    <div className="ra-meta">
                      <span>Scored 85%</span>
                      <span>•</span>
                      <span>2 hours ago</span>
                    </div>
                  </div>
                </div>
                <div className="ra-item study">
                  <div className="ra-icon">📗</div>
                  <div className="ra-content">
                    <div className="ra-main">
                      <div className="ra-label">Chemical Bonding Notes</div>
                      <span className="ra-pill neutral">Completed</span>
                    </div>
                    <div className="ra-meta">
                      <span>Studied for 45 minutes</span>
                      <span>•</span>
                      <span>Yesterday</span>
                    </div>
                  </div>
                </div>
                <div className="ra-item mapping">
                  <div className="ra-icon">🗺️</div>
                  <div className="ra-content">
                    <div className="ra-main">
                      <div className="ra-label">Concept Map Created</div>
                      <span className="ra-pill neutral">Saved</span>
                    </div>
                    <div className="ra-meta">
                      <span>Periodic trends mapping</span>
                      <span>•</span>
                      <span>3 days ago</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
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
      case 'concept-map':
        return <ConceptMap role="student" />;
      case 'knowledge-graph':
        return <KnowledgeGraphVisualizer />;
      case 'progress':
        return <ProgressTracker />;
      case 'learning-path':
        return (
          <LearningPath
            onStartTopic={(topic) => {
              setSelectedLearningTopic(topic);
              setActiveTab('concepts');
            }}
          />
        );
      case 'remediation':
        return <RemediationModule />;
      case 'confidence':
        return <ConfidenceMeter />;
      case 'ar-multimedia':
        return <ARMultimediaModule />;
      case 'molecule-animation':
        return <ARMultimediaModule />;
      case 'periodic-table':
        return <PeriodicTable />;
      case 'chemical-equations':
        return <ChemicalEquations />;
      case 'chemistry-calculator':
        return <ChemistryCalculator />;
      case 'gamification':
        return <GamifiedTracker />;
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
