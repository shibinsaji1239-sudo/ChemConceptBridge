import React, { useState } from 'react';
import api from '../../apiClient';
import './AIQuizGenerator.css';

const AIQuizGenerator = ({ onQuizGenerated, userPerformance, role = 'student' }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(role === 'teacher' ? 'manual' : 'adaptive'); // Default to manual for teachers
  const [manualDifficulty, setManualDifficulty] = useState('Intermediate');

  const isTeacher = role === 'teacher';

  // Common topics
  const topics = [
    'Atomic Structure',
    'Chemical Kinetics',
    'Electrochemistry',
    'Solutions',
    'Periodic Table',
    'Chemical Bonding',
    'Thermodynamics',
    'Acids & Bases',
    'Organic Chemistry'
  ];

  const handleGenerate = async () => {
    if (!topic) {
      setError('Please select a topic');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Determine difficulty
      let difficulty = manualDifficulty;
      if (mode === 'adaptive' && !isTeacher) {
        // Use user performance to determine difficulty for students
        if (userPerformance === 'weak') difficulty = 'Beginner';
        else if (userPerformance === 'strong') difficulty = 'Advanced';
        else difficulty = 'Intermediate';
      }

      const endpoint = (mode === 'adaptive' || isTeacher) ? '/quiz/generate-ai' : '/quiz/generate';

      const { data } = await api.post(endpoint, {
        topic,
        difficulty,
        count: isTeacher ? 10 : 5 // Teachers get a fuller quiz by default
      });

      if (onQuizGenerated) {
        onQuizGenerated(data);
      }

      setError('');
    } catch (err) {
      console.error('Quiz generation error:', err);
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to generate quiz.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-quiz-generator">
      <div className="ai-header">
        <h3>{isTeacher ? '🧪 Create AI Quiz for Students' : '🤖 AI Quiz Generator'}</h3>
        <p>{isTeacher ? 'Instantly generate a high-quality quiz for your classes' : 'Create a custom quiz tailored to your learning level'}</p>
      </div>

      <div className="ai-controls">
        <div className="control-group">
          <label>Topic</label>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">Select a topic...</option>
            {topics.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {!isTeacher && (
          <div className="control-group">
            <label>Mode</label>
            <div className="mode-toggle">
              <button
                className={mode === 'adaptive' ? 'active' : ''}
                onClick={() => setMode('adaptive')}
              >
                Adaptive (AI)
              </button>
              <button
                className={mode === 'manual' ? 'active' : ''}
                onClick={() => setMode('manual')}
              >
                Manual
              </button>
            </div>
          </div>
        )}

        {(mode === 'manual' || isTeacher) && (
          <div className="control-group">
            <label>Target Difficulty</label>
            <select value={manualDifficulty} onChange={(e) => setManualDifficulty(e.target.value)}>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        )}

        {mode === 'adaptive' && userPerformance && !isTeacher && (
          <div className="adaptive-info">
            <span className="info-icon">ℹ️</span>
            <span>Based on your performance, we recommend: <strong>{
              userPerformance === 'weak' ? 'Beginner' :
                userPerformance === 'strong' ? 'Advanced' : 'Intermediate'
            }</strong></span>
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={loading}
          style={{ background: isTeacher ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '' }}
        >
          {loading ? 'Generating...' : isTeacher ? 'Create Quiz ✨' : 'Generate Quiz'}
        </button>
      </div>
    </div>
  );
};

export default AIQuizGenerator;
