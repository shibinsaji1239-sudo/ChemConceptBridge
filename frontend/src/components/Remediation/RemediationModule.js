import React, { useState, useEffect } from 'react';
import api from '../../apiClient';
import './RemediationModule.css';

const RemediationModule = ({ attemptId, score: propScore }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [attemptsList, setAttemptsList] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [attemptDetails, setAttemptDetails] = useState(null);
  const [misconceptionReport, setMisconceptionReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [weakAreas, setWeakAreas] = useState([]);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [detectedCount, setDetectedCount] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, [attemptId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/quiz/attempts/student');
      const list = Array.isArray(data) ? data : [];
      setAttemptsList(list);

      let targetAttempt = null;
      if (attemptId) {
        targetAttempt = list.find(a => a._id === attemptId);
        // If not in the list (maybe it was just created), we might need to fetch it specifically or just use a placeholder
        if (!targetAttempt && propScore !== undefined) {
           targetAttempt = { _id: attemptId, score: propScore, quizTitle: 'Current Quiz' };
        }
      }

      if (!targetAttempt && list.length > 0) {
        targetAttempt = list[0];
      }

      if (targetAttempt) {
        setSelectedAttempt(targetAttempt);
        loadAttemptDetails(targetAttempt._id);
        loadMisconceptionReport(targetAttempt._id);
        loadAiRecommendations(targetAttempt._id);
      }
    } catch (error) {
      console.error('Error loading attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAiRecommendations = async (attemptId) => {
    try {
      const { data } = await api.post('/remediation/recommend', { attemptId });
      setAiRecommendations(data.recommendations || []);
      setDetectedCount(data.detectedMisconceptions || 0);
    } catch (error) {
      console.error('Error loading AI recommendations:', error);
    }
  };

  const loadMisconceptionReport = async (attemptId) => {
    try {
      setReportLoading(true);
      const { data } = await api.get(`/remediation/attempt/${attemptId}/misconceptions`);
      setMisconceptionReport(data || null);
    } catch (error) {
      console.error('Error loading misconception report:', error);
      setMisconceptionReport({ error: true });
    } finally {
      setReportLoading(false);
    }
  };

  const loadAttemptDetails = async (attemptId) => {
    try {
      const { data } = await api.get(`/quiz/attempts/${attemptId}/review`);
      const details = data.answers || [];
      setAttemptDetails(details);
      
      const incorrectAnswers = details.filter(q => !q.isCorrect);
      const areas = {};
      incorrectAnswers.forEach(q => {
        const topic = q.topic || 'General Chemistry';
        areas[topic] = (areas[topic] || 0) + 1;
      });
      setWeakAreas(Object.entries(areas).map(([topic, count]) => ({
        topic,
        count,
        percentage: Math.round((count / details.length) * 100)
      })));
    } catch (error) {
      console.error('Error loading attempt details:', error);
    }
  };

  const learningResources = {
    'Atomic Structure': [
      { type: 'Video', title: 'Understanding Atoms and Electrons', url: 'https://www.youtube.com/watch?v=3FIq55fxPMs' },
      { type: 'Interactive', title: 'Bohr Model Simulation', url: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_en.html' },
      { type: 'Article', title: 'Electron Configuration Guide', url: '#' }
    ],
    'Chemical Bonding': [
      { type: 'Video', title: 'Types of Chemical Bonds', url: 'https://www.youtube.com/watch?v=QXT4OVM4vXI' },
      { type: 'Interactive', title: 'Molecular Polarity Explorer', url: 'https://phet.colorado.edu/sims/html/molecule-polarity/latest/molecule-polarity_en.html' },
      { type: 'Simulation', title: 'Bond Formation Visualizer', url: '#' }
    ],
    'Stoichiometry': [
      { type: 'Calculator', title: 'Mole & Mass Calculator', url: '/chemistry-calculator' },
      { type: 'Video', title: 'Stoichiometry Explained', url: 'https://www.youtube.com/watch?v=9T7Ugct6VsY' },
      { type: 'Practice', title: 'Stoichiometry Problem Set', url: '#' }
    ],
    'Acid-Base Reactions': [
      { type: 'Video', title: 'Acids and Bases Basics', url: 'https://www.youtube.com/watch?v=KZ8qf4m5YwI' },
      { type: 'Interactive', title: 'pH Scale Explorer', url: 'https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_en.html' },
      { type: 'Simulation', title: 'Acid-Base Neutralization', url: 'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_en.html' }
    ],
    'Thermodynamics': [
      { type: 'Video', title: 'Energy and Thermodynamics', url: 'https://www.youtube.com/watch?v=5Y2X1jRAon0' },
      { type: 'Simulation', title: 'Energy Forms and Changes', url: 'https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_en.html' },
      { type: 'Interactive', title: 'Exothermic vs Endothermic', url: '#' }
    ]
  };

  const renderOverview = () => {
    if (!selectedAttempt) {
      return <div className="empty-state">No quiz attempts found. Take a quiz to get started!</div>;
    }

    const score = selectedAttempt.score || 0;
    
    // Calculate correct and incorrect from attemptDetails if available (most accurate)
    let correctCount = 0;
    let incorrectCount = 0;
    let totalQuestions = 0;
    
    if (attemptDetails && attemptDetails.length > 0) {
      // Use actual answer data for accurate counts
      correctCount = attemptDetails.filter(q => q.isCorrect).length;
      incorrectCount = attemptDetails.filter(q => !q.isCorrect).length;
      totalQuestions = attemptDetails.length;
    } else {
      // Fallback: Calculate from score percentage if details not loaded yet
      totalQuestions = selectedAttempt.totalQuestions || 
                      (selectedAttempt.quiz?.questions?.length) || 
                      (selectedAttempt.answers?.length) || 0;
      
      if (totalQuestions > 0) {
        correctCount = Math.round((score * totalQuestions) / 100);
        incorrectCount = totalQuestions - correctCount;
      }
    }

    return (
      <div className="remediation-overview">
        <div className="attempt-summary">
          <h3>📊 Quiz Performance</h3>
          <div className="summary-stats">
            <div className="stat-card">
              <div className="stat-value">{score}%</div>
              <div className="stat-label">Overall Score</div>
            </div>
            <div className="stat-card success">
              <div className="stat-value">{correctCount}</div>
              <div className="stat-label">Correct Answers</div>
            </div>
            <div className="stat-card error">
              <div className="stat-value">{incorrectCount}</div>
              <div className="stat-label">Incorrect Answers</div>
            </div>
          </div>
        </div>

        {detectedCount > 0 && (
          <div className="ai-insights">
            <h3>🤖 AI Misconception Detection</h3>
            <div className="ai-status">
              <span className="status-badge">AI Active</span>
              <p>Detected <strong>{detectedCount}</strong> specific misconception{detectedCount !== 1 ? 's' : ''} in this attempt.</p>
            </div>
            <div className="recommendations-brief">
              {aiRecommendations.slice(0, 3).map((rec, idx) => (
                <div key={idx} className={`rec-mini severity-${rec.severity}`}>
                  <span className="rec-reason">{rec.reason}</span>
                  <span className="rec-category">{rec.category}</span>
                </div>
              ))}
              {aiRecommendations.length > 3 && (
                <button className="view-all-btn" onClick={() => setActiveTab('resources')}>
                  View all {aiRecommendations.length} recommendations
                </button>
              )}
            </div>
          </div>
        )}

        {weakAreas.length > 0 && (
          <div className="weak-areas">
            <h3>🎯 Areas Needing Improvement</h3>
            <div className="areas-list">
              {weakAreas.map((area, idx) => (
                <div key={idx} className="area-item">
                  <div className="area-info">
                    <h4>{area.topic}</h4>
                    <p>{area.count} incorrect answer{area.count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="area-bar">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${area.percentage}%` }}></div>
                    </div>
                    <span className="percentage">{area.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAnswerReview = () => {
    if (!attemptDetails || attemptDetails.length === 0) {
      return <div className="empty-state">No detailed review available</div>;
    }

    return (
      <div className="answer-review">
        <h3>📝 Answer Review & Corrections</h3>
        <div className="questions-list">
          {attemptDetails.map((question, idx) => (
            <div key={idx} className={`question-item ${question.isCorrect ? 'correct' : 'incorrect'}`}>
              <div 
                className="question-header"
                onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
              >
                <div className="question-status">
                  <span className="status-icon">{question.isCorrect ? '✓' : '✗'}</span>
                  <span className="question-text">{question.question}</span>
                </div>
                <span className="toggle-icon">{expandedQuestion === idx ? '−' : '+'}</span>
              </div>

              {expandedQuestion === idx && (
                <div className="question-details">
                  <div className="detail-row">
                    <span className="label">Your Answer:</span>
                    <span className={`answer ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                      {question.userAnswer || '—'}
                    </span>
                  </div>
                  
                  {!question.isCorrect && (
                    <div className="detail-row">
                      <span className="label">Correct Answer:</span>
                      <span className="answer correct">{question.correctText}</span>
                    </div>
                  )}

                  {question.explanation && (
                    <div className="detail-row">
                      <span className="label">Explanation:</span>
                      <span className="explanation">{question.explanation}</span>
                    </div>
                  )}

                  {!question.isCorrect && (
                    <div className="recommended-resources">
                      <strong>📚 Recommended Learning:</strong>
                      {learningResources[question.topic]?.map((resource, ridx) => (
                        <a key={ridx} href={resource.url} target="_blank" rel="noreferrer" className="resource-link">
                          {resource.type}: {resource.title}
                        </a>
                      )) || <p>General chemistry resources recommended</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLearningResources = () => {
    return (
      <div className="learning-resources">
        <h3>📚 Learning Resources</h3>
        
        {aiRecommendations.length > 0 && (
          <div className="ai-recommendations">
            <h4>🤖 AI Recommended for You</h4>
            <div className="resources-grid">
              {aiRecommendations.map((rec, idx) => (
                <a 
                  key={idx}
                  href={rec.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className={`resource-card ai-rec severity-${rec.severity}`}
                >
                  <div className="rec-header">
                    <span className="resource-type">{rec.type}</span>
                    <span className="severity-tag">{rec.severity} priority</span>
                  </div>
                  <span className="resource-title">{rec.title}</span>
                  <p className="rec-reasoning">Reason: {rec.reason}</p>
                  <span className="resource-arrow">→</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="resources-grid">
          {Object.entries(learningResources).map(([topic, resources]) => (
            <div key={topic} className="resource-section">
              <h4>{topic}</h4>
              <div className="resource-items">
                {resources.map((resource, idx) => (
                  <a 
                    key={idx}
                    href={resource.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="resource-card"
                  >
                    <span className="resource-type">{resource.type}</span>
                    <span className="resource-title">{resource.title}</span>
                    <span className="resource-arrow">→</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderConceptClarity = () => {
    const rows = misconceptionReport?.analyses || [];
    const incorrect = rows.filter((r) => !r.isCorrect);

    return (
      <div className="concept-clarity">
        <h3>🔍 Misconception Detection (from your quiz)</h3>

        {!selectedAttempt ? (
          <div className="empty-state">Select an attempt to see misconceptions.</div>
        ) : reportLoading ? (
          <div className="empty-state">Loading misconception report…</div>
        ) : misconceptionReport?.error ? (
          <div className="empty-state">Failed to load misconception report. Please try again later.</div>
        ) : !misconceptionReport || incorrect.length === 0 ? (
          <div className="empty-state">No specific misconceptions detected — great job!</div>
        ) : (
          <div className="misconceptions-grid">
            {incorrect.map((q, idx) => (
              <div className="misconception-card" key={q.questionId || idx}>
                <div className="mc-section">
                  <h4>🧪 Question</h4>
                  <p>{q.question}</p>
                </div>

                <div className="mc-section">
                  <h4>✗ Your Answer</h4>
                  <p><strong>{q.userAnswer || '—'}</strong></p>
                </div>

                <div className="mc-section correct">
                  <h4>✓ Correct Answer</h4>
                  <p><strong>{q.correctText || '—'}</strong></p>
                </div>

                {q.explanation && (
                  <div className="mc-section">
                    <h4>📌 Detailed Explanation (from quiz)</h4>
                    <p>{q.explanation}</p>
                  </div>
                )}

                <div className="mc-section">
                  <h4>🤖 Detected Misconceptions</h4>
                  {Array.isArray(q.misconceptions) && q.misconceptions.length > 0 ? (
                    q.misconceptions.slice(0, 2).map((m, midx) => (
                      <div key={midx} style={{ marginBottom: 10 }}>
                        <p><strong>{m.misconception}</strong> <span style={{ color: '#6b7280' }}>({m.severity})</span></p>
                        <p><strong>Why it’s wrong:</strong> {m.whyWrong}</p>
                        <p><strong>Correct understanding:</strong> {m.correctUnderstanding}</p>
                        {m.example ? <p><strong>Example:</strong> {m.example}</p> : null}
                      </div>
                    ))
                  ) : (
                    <p>No specific pattern-based misconception detected for this answer. Use the quiz explanation above.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPracticeProblems = () => {
    return (
      <div className="practice-problems">
        <h3>✏️ Practice Problems</h3>
        <div className="practice-sections">
          <div className="practice-section">
            <h4>Stoichiometry Problems</h4>
            <button className="practice-btn">Start Practice Set</button>
          </div>
          <div className="practice-section">
            <h4>Acid-Base Equilibrium</h4>
            <button className="practice-btn">Start Practice Set</button>
          </div>
          <div className="practice-section">
            <h4>Electron Configuration</h4>
            <button className="practice-btn">Start Practice Set</button>
          </div>
          <div className="practice-section">
            <h4>Molecular Geometry</h4>
            <button className="practice-btn">Start Practice Set</button>
          </div>
          <div className="practice-section">
            <h4>Thermodynamics</h4>
            <button className="practice-btn">Start Practice Set</button>
          </div>
          <div className="practice-section">
            <h4>Oxidation-Reduction</h4>
            <button className="practice-btn">Start Practice Set</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="remediation-module-v2">
      <div className="remediation-header">
        <div className="header-content">
          <button
            className="back-link"
            type="button"
            onClick={() => {
              const event = new CustomEvent('navigate-to-tab', { detail: { tab: 'overview' } });
              window.dispatchEvent(event);
            }}
          >
            ← Back to Dashboard
          </button>
          <div>
            <h2>🧠 Intelligent Remediation Module</h2>
            <p>Personalized learning paths based on your quiz performance</p>
          </div>
        </div>
      </div>

      <div className="remediation-container">
        <div className="sidebar">
          <div className="attempts-section">
            <h4>📋 Your Attempts</h4>
            {loading ? (
              <p>Loading...</p>
            ) : attemptsList.length === 0 ? (
              <p className="no-attempts">No attempts yet</p>
            ) : (
              <div className="attempts-list">
                {attemptsList.map((attempt) => (
                  <button
                    key={attempt._id}
                    className={`attempt-btn ${selectedAttempt?._id === attempt._id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedAttempt(attempt);
                      loadAttemptDetails(attempt._id);
                      loadMisconceptionReport(attempt._id);
                      loadAiRecommendations(attempt._id);
                      setExpandedQuestion(null);
                      setActiveTab('overview');
                    }}
                  >
                    <span className="attempt-title">{attempt.quizTitle || 'Quiz'}</span>
                    <span className="attempt-score">{attempt.score}%</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="main-content">
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button 
              className={`tab-btn ${activeTab === 'answers' ? 'active' : ''}`}
              onClick={() => setActiveTab('answers')}
            >
              📝 Answer Review
            </button>
            <button 
              className={`tab-btn ${activeTab === 'concepts' ? 'active' : ''}`}
              onClick={() => setActiveTab('concepts')}
            >
              🔍 Concept Clarity
            </button>
            <button 
              className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => setActiveTab('resources')}
            >
              📚 Resources
            </button>
            <button 
              className={`tab-btn ${activeTab === 'practice' ? 'active' : ''}`}
              onClick={() => setActiveTab('practice')}
            >
              ✏️ Practice
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'answers' && renderAnswerReview()}
            {activeTab === 'concepts' && renderConceptClarity()}
            {activeTab === 'resources' && renderLearningResources()}
            {activeTab === 'practice' && renderPracticeProblems()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemediationModule;
