import React, { useState, useEffect } from 'react';
import api from '../../apiClient';
import './RevisionModule.css';

const RevisionModule = () => {
  const [schedule, setSchedule] = useState({ due: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchRevisionData();
  }, []);

  const fetchRevisionData = async () => {
    try {
      setLoading(true);
      const [scheduleRes, statsRes] = await Promise.all([
        api.get('/revision/schedule'),
        api.get('/revision/stats')
      ]);
      setSchedule(scheduleRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch revision data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (conceptId, quality) => {
    try {
      await api.post('/update', { conceptId, quality });
      // Update local state to remove the item from due list
      setSchedule(prev => ({
        ...prev,
        due: prev.due.filter(item => item.concept._id !== conceptId)
      }));
      // Refresh data
      fetchRevisionData();
    } catch (err) {
      console.error('Failed to update revision progress:', err);
    }
  };

  if (loading) return <div className="revision-loading">Analyzing your learning patterns...</div>;

  return (
    <div className="revision-container fade-in">
      <div className="revision-header">
        <h1>Personalized Revision Scheduler</h1>
        <p>AI-powered spaced repetition to prevent concept decay</p>
      </div>

      <div className="revision-stats-grid">
        <div className="rev-stat-card">
          <div className="stat-value">{stats?.total || 0}</div>
          <div className="stat-label">Concepts Tracked</div>
        </div>
        <div className="rev-stat-card">
          <div className="stat-value">{stats?.mastered || 0}</div>
          <div className="stat-label">Mastered (Long-term)</div>
        </div>
        <div className="rev-stat-card active">
          <div className="stat-value">{schedule.due.length}</div>
          <div className="stat-label">Due for Revision</div>
        </div>
      </div>

      <div className="revision-main-grid">
        <div className="revision-section">
          <h2>🔔 Due Today</h2>
          {schedule.due.length === 0 ? (
            <div className="empty-state">
              <span className="icon">✅</span>
              <p>Your memory is fresh! Nothing due for revision right now.</p>
            </div>
          ) : (
            <div className="revision-list">
              {schedule.due.map(item => (
                <div key={item._id} className="revision-card due">
                  <div className="rev-card-header">
                    <h3>{item.concept.title}</h3>
                    <span className={`difficulty-tag ${item.concept.difficulty.toLowerCase()}`}>
                      {item.concept.difficulty}
                    </span>
                  </div>
                  <p className="rev-topic">{item.concept.topic}</p>
                  <div className="rev-meta">
                    <span>Interval: {item.interval} days</span>
                    <span>•</span>
                    <span>Repetitions: {item.repetitionCount}</span>
                  </div>
                  <div className="rev-actions">
                    <p>How well do you remember this?</p>
                    <div className="quality-btns">
                      {[1, 2, 3, 4, 5].map(q => (
                        <button 
                          key={q} 
                          onClick={() => handleReview(item.concept._id, q)}
                          className={`q-btn q-${q}`}
                          title={`Quality: ${q}`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="revision-section">
          <h2>📅 Upcoming Revisions</h2>
          <div className="revision-list mini">
            {schedule.upcoming.map(item => (
              <div key={item._id} className="revision-card upcoming">
                <div className="rev-card-info">
                  <h4>{item.concept.title}</h4>
                  <p>Next review: {new Date(item.nextReview).toLocaleDateString()}</p>
                </div>
                <div className="rev-card-days">
                  in {Math.ceil((new Date(item.nextReview) - new Date()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
            ))}
            {schedule.upcoming.length === 0 && <p className="empty-mini">No upcoming revisions scheduled.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevisionModule;
