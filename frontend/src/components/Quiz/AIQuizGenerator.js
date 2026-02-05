import React, { useState } from 'react';
import api from '../../apiClient';
import './AIQuizGenerator.css';

const AIQuizGenerator = ({ onQuizGenerated, userPerformance }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('adaptive'); // 'adaptive' or 'manual'
  const [manualDifficulty, setManualDifficulty] = useState('Intermediate');

  // Common topics - ideally this should come from an API or extracted from existing quizzes
  const topics = [
    'Atomic Structure',
    'Chemical Bonding',
    'Thermodynamics',
    'Periodic Table',
    'Stoichiometry',
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
      if (mode === 'adaptive') {
        // Use user performance to determine difficulty
        // userPerformance is expected to be 'weak', 'average', or 'strong'
        if (userPerformance === 'weak') difficulty = 'Beginner';
        else if (userPerformance === 'strong') difficulty = 'Advanced';
        else difficulty = 'Intermediate';
      }

      const endpoint = mode === 'adaptive' ? '/quiz/generate-ai' : '/quiz/generate';
      
      const { data } = await api.post(endpoint, {
        topic,
        difficulty
      });

      if (onQuizGenerated) {
        onQuizGenerated(data);
      }
      
      // Clear error on success
      setError('');
    } catch (err) {
      console.error('Quiz generation error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to generate quiz. Please ensure you are logged in and there are quizzes available for this topic.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-quiz-generator">
      <div className="ai-header">
        <h3>🤖 AI Quiz Generator</h3>
        <p>Create a custom quiz tailored to your learning level</p>
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

        {mode === 'manual' && (
          <div className="control-group">
            <label>Difficulty</label>
            <select value={manualDifficulty} onChange={(e) => setManualDifficulty(e.target.value)}>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        )}

        {mode === 'adaptive' && userPerformance && (
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
        >
          {loading ? 'Generating...' : 'Generate Quiz'}
        </button>
      </div>
    </div>
  );
};

export default AIQuizGenerator;
