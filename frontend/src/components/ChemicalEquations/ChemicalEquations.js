import React, { useState, useEffect } from 'react';
import './ChemicalEquations.css';
import api from '../../apiClient';

const ChemicalEquations = () => {
  const [equations, setEquations] = useState([]);
  const [selectedEquation, setSelectedEquation] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHints, setShowHints] = useState(false);

  // 🧠 Cognitive Load Tracking
  const [cognitiveSessionId, setCognitiveSessionId] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Track global clicks
  useEffect(() => {
    const handleClick = () => {
      if (selectedEquation && !result) {
        setClickCount(prev => prev + 1);
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [selectedEquation, result]);

  useEffect(() => {
    fetchEquations();
  }, []);

  // Fallback sample equations when backend has no data
  const getMockEquations = () => ([
    {
      equationString: 'H2 + O2 -> H2O',
      balancedEquationString: '2H2 + O2 -> 2H2O',
      topic: 'Combustion',
      difficulty: 'Beginner',
      explanation: 'Hydrogen combusts with oxygen to form water. Balance atoms on both sides.',
      hints: ['Count atoms', 'Balance H2O first', 'Adjust coefficients only']
    },
    {
      equationString: 'Na + Cl2 -> NaCl',
      balancedEquationString: '2Na + Cl2 -> 2NaCl',
      topic: 'Synthesis',
      difficulty: 'Beginner',
      explanation: 'Sodium reacts with chlorine to form sodium chloride.',
      hints: ['Na is +1', 'Cl is -1', 'Match ionic charges']
    },
    {
      equationString: 'CaCO3 + HCl -> CaCl2 + H2O + CO2',
      balancedEquationString: 'CaCO3 + 2HCl -> CaCl2 + H2O + CO2',
      topic: 'Acid-Base Reactions',
      difficulty: 'Intermediate',
      explanation: 'Neutralization and gas evolution reaction.',
      hints: ['Double displacement', 'Balance H and O last']
    }
  ]);

  const fetchEquations = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/chemical-equations');
      const list = Array.isArray(data) && data.length > 0 ? data : getMockEquations();
      if (!Array.isArray(data) || data.length === 0) {
        setError('Showing sample equations (no server data found)');
      }
      setEquations(list);
    } catch (e) {
      setEquations(getMockEquations());
      setError('Failed to load equations. Showing sample data instead.');
    } finally {
      setLoading(false);
    }
  };

  const selectEquation = (equation) => {
    setSelectedEquation(equation);
    setUserAnswer('');
    setResult(null);
    setShowHints(false);
    
    // Init Cognitive Session
    setCognitiveSessionId(`eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    setStartTime(Date.now());
    setClickCount(0);
    setRetryCount(0);
  };

  const checkAnswer = async () => {
    if (!selectedEquation || !userAnswer.trim()) return;
    
    let isCorrect = false;
    let checkResult = null;

    try {
      setLoading(true);
      if (selectedEquation._id) {
        const { data } = await api.post(`/chemical-equations/${selectedEquation._id}/check-balance`, {
          userEquation: userAnswer
        });
        checkResult = data;
        isCorrect = data.isCorrect;
        setResult(data);
      } else {
        isCorrect = userAnswer.trim().toLowerCase() === selectedEquation.balancedEquationString.trim().toLowerCase();
        checkResult = {
          isCorrect,
          correctAnswer: selectedEquation.balancedEquationString,
          explanation: selectedEquation.explanation,
          hints: selectedEquation.hints || []
        };
        setResult(checkResult);
      }

      // 🧠 Log Cognitive Data
      const timeSpent = Date.now() - startTime;
      await api.post('/cognitive/log', {
        sessionId: cognitiveSessionId,
        activityType: 'chemical_equation',
        resourceId: selectedEquation._id || selectedEquation.equationString, // Use string as ID for mock
        timeSpent,
        retryCount,
        clickCount
      });

      if (!isCorrect) {
        setRetryCount(prev => prev + 1);
      }

    } catch (e) {
      setError('Failed to check answer');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading && equations.length === 0) {
    return <div className="loading">Loading chemical equations...</div>;
  }

  return (
    <div className="chemical-equations">
      <div className="ce-header">
        <h2>Chemical Equations</h2>
        <p>Practice balancing chemical equations and master stoichiometry</p>
      </div>

      <div className="ce-tutorial-section">
        <div className="tutorial-card">
          <h3>📘 Mastering Chemical Balancing</h3>
          <div className="tutorial-content">
            <p className="intro-text">Balancing ensures that the same number of atoms exist on both the <strong>Reactants</strong> (left) and <strong>Products</strong> (right) sides.</p>
            
            <div className="tutorial-steps">
              <div className="step-box">
                <span className="step-tag">Step 1</span>
                <p>Identify unbalanced atoms. In <code>H₂ + O₂ → H₂O</code>, Oxygen is unbalanced (2 on left, 1 on right).</p>
              </div>
              <div className="step-box">
                <span className="step-tag">Step 2</span>
                <p>Add <strong>coefficients</strong> (the big numbers in front). Never change subscripts (the small numbers).</p>
              </div>
              <div className="step-box">
                <span className="step-tag">Step 3</span>
                <p>Recount until all atoms match. <code>2H₂ + O₂ → 2H₂O</code> is now balanced!</p>
              </div>
            </div>

            <div className="balance-comparison">
              <h4>Atom Balance Table (Balanced State):</h4>
              <table className="atom-table">
                <thead>
                  <tr>
                    <th>Element</th>
                    <th>Reactants (Left)</th>
                    <th>Products (Right)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Hydrogen (H)</td>
                    <td>2 × 2 = <strong>4</strong></td>
                    <td>2 × 2 = <strong>4</strong></td>
                    <td>✅ Balanced</td>
                  </tr>
                  <tr>
                    <td>Oxygen (O)</td>
                    <td>1 × 2 = <strong>2</strong></td>
                    <td>2 × 1 = <strong>2</strong></td>
                    <td>✅ Balanced</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="ce-content">
        <div className="equations-list">
          <h3>Available Equations</h3>
          <div className="equations-grid">
            {equations.map(equation => (
              <div 
                key={equation._id} 
                className={`equation-card ${selectedEquation?._id === equation._id ? 'selected' : ''}`}
                onClick={() => selectEquation(equation)}
              >
                <div className="equation-header">
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(equation.difficulty) }}
                  >
                    {equation.difficulty}
                  </span>
                  <span className="topic">{equation.topic}</span>
                </div>
                <div className="equation-text">{equation.equationString}</div>
                <div className="equation-stats">
                  <span>Attempts: {equation.attempts || 0}</span>
                  <span>Success: {Math.round(equation.successRate || 0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="practice-area">
          {selectedEquation ? (
            <div className="practice-card">
              <h3>Balance This Equation</h3>
              <div className="equation-to-balance">
                <div className="original-equation">
                  <strong>Original:</strong> {selectedEquation.equationString}
                </div>
              </div>

              <div className="input-section">
                <label htmlFor="user-answer">Your Answer:</label>
                <input
                  id="user-answer"
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter balanced equation (e.g., 2H2 + O2 → 2H2O)"
                  className="answer-input"
                />
                <div className="button-group">
                  <button 
                    onClick={checkAnswer} 
                    disabled={!userAnswer.trim() || loading}
                    className="check-btn"
                  >
                    {loading ? 'Checking...' : 'Check Answer'}
                  </button>
                  <button 
                    onClick={() => setShowHints(!showHints)}
                    className="hints-btn"
                  >
                    {showHints ? 'Hide Hints' : 'Show Hints'}
                  </button>
                </div>
              </div>

              {showHints && selectedEquation.hints && selectedEquation.hints.length > 0 && (
                <div className="hints-section">
                  <h4>Hints:</h4>
                  <ul>
                    {selectedEquation.hints.map((hint, index) => (
                      <li key={index}>{hint}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result && (
                <div className={`result-section ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="result-header">
                    {result.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                  </div>
                  {!result.isCorrect && (
                    <div className="correct-answer">
                      <strong>Correct Answer:</strong> {result.correctAnswer}
                    </div>
                  )}
                  {result.explanation && (
                    <div className="explanation">
                      <strong>Explanation:</strong> {result.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="no-selection">
              <h3>Select an Equation</h3>
              <p>Choose an equation from the list to start practicing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChemicalEquations;
