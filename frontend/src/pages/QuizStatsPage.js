// frontend/src/pages/QuizStatsPage.js
// Teacher-only page to view quiz details and statistics
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../apiClient';
import './QuizStatsPage.css';

const StatCard = ({ icon, label, value, tone = 'default' }) => (
  <div className={`qs-card qs-card-${tone}`}>
    <div className="qs-card-icon">{icon}</div>
    <div className="qs-card-value">{value}</div>
    <div className="qs-card-label">{label}</div>
  </div>
);

const Bar = ({ label, value, max = 100, suffix = '%' }) => {
  const width = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="qs-bar">
      <div className="qs-bar-meta">
        <span className="qs-bar-label">{label}</span>
        <span className="qs-bar-value">{value}{suffix}</span>
      </div>
      <div className="qs-bar-track">
        <div className="qs-bar-fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

const QuizStatsPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [quizRes, statsRes] = await Promise.all([
          api.get(`/quiz/${quizId}`),
          api.get(`/quiz/${quizId}/stats`),
        ]);
        if (!mounted) return;
        setQuiz(quizRes.data);
        setStats(statsRes.data);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load quiz stats');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [quizId]);

  const misconceptionsList = useMemo(() => {
    if (!stats) return [];
    const total = stats.totalAttempts || 0;
    return Object.entries(stats.commonMisconceptions || {})
      .sort((a, b) => b[1] - a[1])
      .map(([text, count]) => ({ text, count, pct: total ? Math.round((count / total) * 100) : 0 }));
  }, [stats]);

  if (loading) {
    return (
      <div className="qs-container">
        <div className="qs-loading">Loading quiz stats…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qs-container">
        <div className="qs-error">{error}</div>
        <button className="qs-button" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!quiz || !stats) {
    return (
      <div className="qs-container">
        <div className="qs-error">Quiz or stats not found.</div>
        <button className="qs-button" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="qs-container">
      <div className="qs-header">
        <div>
          <h2 className="qs-title">{quiz.title}</h2>
          <div className="qs-subtitle">
            <span className="qs-pill">{quiz.topic}</span>
            <span className="qs-divider">•</span>
            <span className="qs-pill qs-pill-muted">{quiz.difficulty}</span>
            {quiz?.createdBy?.name && (
              <>
                <span className="qs-divider">•</span>
                <span className="qs-muted">By {quiz.createdBy.name}</span>
              </>
            )}
          </div>
        </div>
        <div className="qs-actions">
          <Link to="/teacher-dashboard" className="qs-button qs-button-secondary">Back to Dashboard</Link>
        </div>
      </div>

      <div className="qs-grid">
        <StatCard icon="🧮" label="Total Attempts" value={stats.totalAttempts} tone="primary" />
        <StatCard icon="📈" label="Average Score" value={`${(stats.averageScore || 0).toFixed(1)}%`} tone="success" />
        <StatCard icon="✅" label="Completion Rate" value={`${(stats.completionRate || 0).toFixed(0)}%`} tone="info" />
        <StatCard icon="📝" label="Questions" value={quiz.questions?.length || 0} tone="warning" />
      </div>

      <div className="qs-section">
        <h3 className="qs-section-title">Student Performance</h3>
        {stats.studentPerformance?.length ? (
          <div className="qs-card qs-table-wrapper">
            <table className="qs-table">
              <thead>
                <tr>
                  <th>Student Name/Email</th>
                  <th>Score</th>
                  <th>Time Spent</th>
                  <th>Confidence</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.studentPerformance.map((sp, idx) => {
                  const scoreClass = sp.score >= 80 ? 'qs-score-high' : sp.score >= 50 ? 'qs-score-mid' : 'qs-score-low';
                  const timeStr = sp.timeSpent ? `${Math.floor(sp.timeSpent / 60)}m ${sp.timeSpent % 60}s` : 'N/A';
                  return (
                    <tr key={idx}>
                      <td>{sp.student?.name || sp.student?.email || 'Unknown Student'}</td>
                      <td>
                        <span className={`qs-score-badge ${scoreClass}`}>
                          {sp.score}%
                        </span>
                      </td>
                      <td>{timeStr}</td>
                      <td>{sp.confidenceLevel ? `${sp.confidenceLevel}/5` : 'N/A'}</td>
                      <td>{sp.completedAt ? new Date(sp.completedAt).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="qs-empty">No attempts yet.</div>
        )}
      </div>

      <div className="qs-section">
        <h3 className="qs-section-title">Common Misconceptions</h3>
        {misconceptionsList.length ? (
          <div className="qs-card">
            <ul className="qs-misc-list">
              {misconceptionsList.map((m, i) => (
                <li key={i} className="qs-misc-item">
                  <div className="qs-misc-text">{m.text}</div>
                  <div className="qs-misc-meta">
                    <span className="qs-count">{m.count}</span>
                    <span className="qs-pct">{m.pct}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="qs-empty">No misconceptions recorded yet.</div>
        )}
      </div>
    </div>
  );
};

export default QuizStatsPage;