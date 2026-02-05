import React, { useState, useEffect } from 'react';
import './QuizEngine.css';
import api from '../../apiClient';
import RemediationModule from '../Remediation/RemediationModule';
import AIQuizGenerator from './AIQuizGenerator';

const QuizEngine = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [lastAttemptId, setLastAttemptId] = useState(null);
  const [userPerformance, setUserPerformance] = useState(null);

  // 🧠 Cognitive Load Tracking
  const [cognitiveSessionId, setCognitiveSessionId] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [questionClicks, setQuestionClicks] = useState(0);
  const [questionRetries, setQuestionRetries] = useState(0);

  // Track global clicks for cognitive analysis
  useEffect(() => {
    const handleClick = () => {
      if (quizStarted && !quizCompleted) {
        setQuestionClicks(prev => prev + 1);
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [quizStarted, quizCompleted]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/quiz');
        const list = (data || []).map(q => ({
          id: q._id,
          title: q.title,
          description: q.description,
          difficulty: q.difficulty,
          duration: q.duration,
          topic: q.topic,
          questionsCount: Array.isArray(q.questions) ? q.questions.length : (q.questions || 0)
        }));
        setQuizzes(list);
      } catch (e) {
        setQuizzes([]);
      }

      try {
        const { data } = await api.get('/ml/my-prediction');
        if (data && data.prediction) {
          setUserPerformance(data.prediction);
        }
      } catch (e) {
        console.error("Failed to fetch prediction", e);
      }
    })();
  }, []);

  const startQuiz = async (quiz) => {
    try {
      const { data } = await api.get(`/quiz/${quiz.id}`);
      const full = {
        id: data._id,
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        duration: data.duration,
        topic: data.topic,
        questions: (data.questions || []).map(q => ({
          id: q._id,
          question: q.question || "No question text provided",
          options: q.options || [],
        }))
      };
      setSelectedQuiz(full);
      setQuizStarted(true);
      setCurrentQuestion(0);
      setAnswers({});
      setTimeLeft(full.duration * 60);
      setQuizCompleted(false);
      setShowResults(false);
      setLastAttemptId(null);
      
      // Init Cognitive Session
      setCognitiveSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      setQuestionStartTime(Date.now());
      setQuestionClicks(0);
      setQuestionRetries(0);
    } catch (e) {
      // noop
    }
  };

  const handleQuizGenerated = (quiz) => {
    startQuiz({ id: quiz._id });
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    // If changing answer, increment retry count
    if (answers[questionId] !== undefined && answers[questionId] !== answerIndex) {
      setQuestionRetries(prev => prev + 1);
    }
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const nextQuestion = async () => {
    // Log cognitive data for current question
    try {
      if (selectedQuiz && selectedQuiz.questions[currentQuestion]) {
        const timeSpent = Date.now() - questionStartTime;
        await api.post('/cognitive/log', {
           sessionId: cognitiveSessionId,
           activityType: 'quiz',
           resourceId: selectedQuiz.id,
           questionId: selectedQuiz.questions[currentQuestion].id,
           timeSpent,
           retryCount: questionRetries,
           clickCount: questionClicks
        });
      }
    } catch (e) {
      console.error("Cognitive log failed", e);
    }

    // Reset for next
    setQuestionStartTime(Date.now());
    setQuestionClicks(0);
    setQuestionRetries(0);

    if (selectedQuiz && selectedQuiz.questions && currentQuestion < selectedQuiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const finishQuiz = async () => {
    if (!selectedQuiz) return;
    setQuizCompleted(true);
    // Submit attempt to server
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption, timeSpent: 0 })),
        timeSpent: (selectedQuiz.duration * 60) - timeLeft,
        confidenceLevel: 3
      };
      const res = await api.post(`/quiz/${selectedQuiz.id}/attempt`, payload);
      if (res?.data?.score != null) {
        setScore(res.data.score);
      }
      if (res?.data?.attemptId) {
        setLastAttemptId(res.data.attemptId);
      }
    } catch (e) {
      // ignore submit errors in UI for now
    }

    setShowResults(true);
  };

  const resetQuiz = () => {
    setSelectedQuiz(null);
    setQuizStarted(false);
    setQuizCompleted(false);
    setCurrentQuestion(0);
    setAnswers({});
    setScore(0);
    setShowResults(false);
  };

  // Timer effect
  useEffect(() => {
    if (quizStarted && !quizCompleted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quizStarted) {
      finishQuiz();
    }
  }, [timeLeft, quizStarted, quizCompleted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#16a34a';
      case 'Intermediate': return '#d97706';
      case 'Advanced': return '#dc2626';
      default: return '#64748b';
    }
  };

  if (showResults) {
    return (
      <div className="quiz-results">
        <div className="results-card">
          <h2>Quiz Results</h2>
          <div className="score-display">
            <div className="score-circle">
              <span className="score-value">{score}%</span>
            </div>
            <h3>{score >= 80 ? 'Great job!' : score >= 50 ? 'Good effort' : 'Keep trying'}</h3>
            <p>You answered {Object.keys(answers).length} out of {(selectedQuiz?.questions?.length || 0)} questions</p>
          </div>
          
          <div className="results-note">Detailed answer review is hidden to prevent sharing of answer keys. Focus on the recommended next steps below.</div>
          
          <div className="results-actions">
            <button className="btn btn-primary" onClick={resetQuiz}>
              Take Another Quiz
            </button>
            <button className="btn btn-secondary" onClick={() => setShowResults(false)}>
              Review Answers
            </button>
          </div>
        </div>
        {lastAttemptId ? (
          <div className="remediation-wrap">
            <h3>Recommended next steps</h3>
            <RemediationModule attemptId={lastAttemptId} score={score} />
          </div>
        ) : null}
      </div>
    );
  }

  if (quizStarted && selectedQuiz) {
    if (!selectedQuiz.questions || selectedQuiz.questions.length === 0) {
      return (
        <div className="quiz-container">
          <div className="quiz-card">
            <h2>Error</h2>
            <p>This quiz has no questions available.</p>
            <button className="btn btn-primary" onClick={resetQuiz}>Back to Quizzes</button>
          </div>
        </div>
      );
    }

    const question = selectedQuiz.questions[currentQuestion];
    
    if (!question) {
      return (
        <div className="quiz-container">
          <div className="quiz-card">
            <h2>Error</h2>
            <p>Question not found.</p>
            <button className="btn btn-primary" onClick={resetQuiz}>Back to Quizzes</button>
          </div>
        </div>
      );
    }

    const progress = ((currentQuestion + 1) / selectedQuiz.questions.length) * 100;

    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <div className="quiz-info">
            <h2>{selectedQuiz.title}</h2>
            <div className="quiz-meta">
              <span className="question-counter">
                Question {currentQuestion + 1} of {selectedQuiz.questions.length}
              </span>
              <span className="timer">{formatTime(timeLeft)}</span>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="quiz-content">
          <div className="question-card">
            <h3 className="question-text">{question.question}</h3>
            <div className="options">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`option ${answers[question.id] === index ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(question.id, index)}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="quiz-navigation">
            <button 
              className="btn btn-secondary" 
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
            >
              Previous
            </button>
            <button 
              className="btn btn-primary" 
              onClick={nextQuestion}
            >
              {currentQuestion === selectedQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-engine">
      <div className="quiz-header">
        <h2>Available Quizzes</h2>
        <p>Test your chemistry knowledge with our adaptive quiz system</p>
      </div>

      <AIQuizGenerator 
        onQuizGenerated={handleQuizGenerated} 
        userPerformance={userPerformance} 
      />

      <div className="quiz-grid">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="quiz-card">
            <div className="quiz-card-header">
              <h3>{quiz.title}</h3>
              <span 
                className="difficulty-badge"
                style={{ color: getDifficultyColor(quiz.difficulty) }}
              >
                {quiz.difficulty}
              </span>
            </div>
            
            <p className="quiz-description">{quiz.description}</p>
            
            <div className="quiz-meta">
              <div className="meta-item">
                <span className="meta-icon">⏱️</span>
                <span>{quiz.duration} min</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">📝</span>
                <span>{quiz.questionsCount} questions</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">🧪</span>
                <span>{quiz.topic}</span>
              </div>
            </div>
            
            <button 
              className="btn btn-primary quiz-start-btn"
              onClick={() => startQuiz(quiz)}
            >
              Start Quiz
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizEngine;
