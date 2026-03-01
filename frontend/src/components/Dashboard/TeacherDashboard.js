import React, { useEffect, useMemo, useState } from 'react';
import './TeacherDashboard.css';
import api from '../../apiClient';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ContentManagement from './ContentManagement';
import SubscriptionPage from '../../pages/SubscriptionPage';
import VideoManager from '../Videos/VideoManager';
import ConceptDependencyRiskAnalyzer from '../ConceptDependency/ConceptDependencyRiskAnalyzer';
import TeacherPerformanceDashboard from './TeacherPerformanceDashboard';
import LearningPath from '../Progress/LearningPath';
import ExamManager from '../Exams/ExamManager';
import RemediationModule from '../Remediation/RemediationModule';
import ARMultimediaModule from '../ARMultimedia/ARMultimediaModule';
import RevisionModule from '../Revision/RevisionModule';
import PeriodicTable from '../PeriodicTable/PeriodicTable';
import ChemicalEquations from '../ChemicalEquations/ChemicalEquations';
import ChemistryCalculator from '../ChemistryCalculator/ChemistryCalculator';
import MoleculeAnimation from '../MoleculeAnimation/MoleculeAnimation';
import Leaderboard from '../Gamification/Leaderboard';

// Simple list and create UI for quizzes and concepts + Students tab aggregated from quiz stats
const TeacherDashboard = ({ activeTab, setActiveTab, user }) => {
  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [error, setError] = useState('');

  // Listen for navigation events from ContentManagement
  useEffect(() => {
    const handleNavigate = (event) => {
      if (event.detail && typeof event.detail === 'string') {
        setActiveTab(event.detail);
      }
    };
    window.addEventListener('navigate-to-tab', handleNavigate);
    return () => window.removeEventListener('navigate-to-tab', handleNavigate);
  }, [setActiveTab]);

  // Aggregated students derived from attempts on teacher's quizzes
  const [students, setStudents] = useState([]); // [{ id, name, email, attempts, averageScore }]
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  // Create form state
  const [newQuiz, setNewQuiz] = useState({
    title: '', description: '', topic: '', difficulty: 'Beginner', duration: 15,
    questions: [
      { question: '', options: ['', '', '', ''], correct: 0, explanation: '' }
    ]
  });
  const [newConcept, setNewConcept] = useState({
    title: '', description: '', topic: '', difficulty: 'Beginner', estimatedTime: 10
  });
  
  // Form validation
  const [quizFormErrors, setQuizFormErrors] = useState({});
  const [conceptFormErrors, setConceptFormErrors] = useState({});

  // Edit state for quizzes and concepts
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editingConceptId, setEditingConceptId] = useState(null);
  const [editingConcept, setEditingConcept] = useState(null);

  const myQuizzes = useMemo(() => quizzes.filter(q => (q.createdBy?._id || q.createdBy) === user.id), [quizzes, user.id]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/quiz');
      setQuizzes(data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchConcepts = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/concept');
      setConcepts(data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load concepts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsFromStats = async () => {
    try {
      setLoading(true);
      setError('');

      // Base roster from user management: only assigned students for a teacher
      const assignedRes = await api.get('/user/students');
      const assigned = assignedRes.data || [];
      const map = new Map();
      assigned.forEach(s => {
        const sid = String(s._id || s.id);
        if (!sid) return;
        map.set(sid, { id: sid, name: s.name, email: s.email, attempts: 0, totalScore: 0 });
      });

      // Ensure quizzes list is loaded
      if (!quizzes.length) {
        const { data } = await api.get('/quiz');
        setQuizzes(data || []);
      }
      const teacherQuizzes = (quizzes.length ? quizzes : (await api.get('/quiz')).data || [])
        .filter(q => (q.createdBy?._id || q.createdBy) === user.id);

      // Collect stats only to enrich assigned students; ignore non-assigned
      const statsResponses = await Promise.all(
        teacherQuizzes.map(q => api.get(`/quiz/${q._id}/stats`).then(r => r.data).catch(() => null))
      );

      statsResponses.forEach((stats) => {
        if (!stats) return;
        (stats.studentPerformance || []).forEach(sp => {
          const sid = String(sp.student?._id || sp.student);
          if (!sid || !map.has(sid)) return;
          const prev = map.get(sid);
          prev.attempts += 1;
          prev.totalScore += sp.score || 0;
          if (!prev.name && sp.student?.name) prev.name = sp.student.name;
          if (!prev.email && sp.student?.email) prev.email = sp.student.email;
          map.set(sid, prev);
        });
      });

      const arr = Array.from(map.values()).map(s => ({
        ...s,
        averageScore: s.attempts ? Math.round((s.totalScore / s.attempts) * 10) / 10 : 0
      }));
      arr.sort((a, b) => b.attempts - a.attempts || b.averageScore - a.averageScore);
      setStudents(arr);
      setStudentsLoaded(true);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'quizzes' || activeTab === 'overview') fetchQuizzes();
    if (activeTab === 'concepts' || activeTab === 'overview') fetchConcepts();
    if ((activeTab === 'students' || activeTab === 'analytics' || activeTab === 'progress') && !studentsLoaded) fetchStudentsFromStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const validateQuizForm = () => {
    const errors = {};
    if (!newQuiz.title.trim()) errors.title = 'Title is required';
    if (!newQuiz.description.trim()) errors.description = 'Description is required';
    if (!newQuiz.topic.trim()) errors.topic = 'Topic is required';
    if (!newQuiz.duration || newQuiz.duration < 1) errors.duration = 'Duration must be at least 1 minute';
    
    // Validate questions
    const questionErrors = [];
    newQuiz.questions.forEach((q, idx) => {
      const qErrors = {};
      if (!q.question.trim()) qErrors.question = 'Question text is required';
      
      // Check options
      const optionErrors = [];
      let hasEmptyOption = false;
      q.options.forEach((opt, i) => {
        if (!opt.trim()) {
          optionErrors[i] = 'Option cannot be empty';
          hasEmptyOption = true;
        }
      });
      
      if (hasEmptyOption) qErrors.options = optionErrors;
      if (!q.explanation.trim()) qErrors.explanation = 'Explanation is required';
      
      if (Object.keys(qErrors).length > 0) questionErrors[idx] = qErrors;
    });
    
    if (questionErrors.length > 0) errors.questions = questionErrors;
    return errors;
  };

  const createQuiz = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateQuizForm();
    if (Object.keys(errors).length > 0) {
      setQuizFormErrors(errors);
      toast.error('Please fix the errors in the form');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setQuizFormErrors({});
      const { data } = await api.post('/quiz', newQuiz);
      setNewQuiz({
        title: '', description: '', topic: '', difficulty: 'Beginner', duration: 15,
        questions: [{ question: '', options: ['', '', '', ''], correct: 0, explanation: '' }]
      });
      await fetchQuizzes();
      setActiveTab('quizzes');
      toast.success(`Quiz "${data.title}" created successfully`);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create quiz');
      toast.error(e?.response?.data?.message || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  const validateConceptForm = () => {
    const errors = {};
    if (!newConcept.title.trim()) errors.title = 'Title is required';
    if (!newConcept.description.trim()) errors.description = 'Description is required';
    if (!newConcept.topic.trim()) errors.topic = 'Topic is required';
    if (!newConcept.estimatedTime || newConcept.estimatedTime < 1) {
      errors.estimatedTime = 'Estimated time must be at least 1 minute';
    }
    return errors;
  };

  const createConcept = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateConceptForm();
    if (Object.keys(errors).length > 0) {
      setConceptFormErrors(errors);
      toast.error('Please fix the errors in the form');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setConceptFormErrors({});
      const { data } = await api.post('/concept', newConcept);
      setNewConcept({ title: '', description: '', topic: '', difficulty: 'Beginner', estimatedTime: 10 });
      await fetchConcepts();
      setActiveTab('concepts');
      toast.success(`Concept "${data.title}" created successfully`);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create concept');
      toast.error(e?.response?.data?.message || 'Failed to create concept');
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    const myConcepts = concepts.filter(c => (c.createdBy?._id || c.createdBy) === user.id);
    return (
      <div className="teacher-overview">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary">👥</div>
            <div className="stat-value">{studentsLoaded ? students.length : '—'}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">📝</div>
            <div className="stat-value">{myQuizzes.length}</div>
            <div className="stat-label">My Quizzes</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">📚</div>
            <div className="stat-value">{myConcepts.length}</div>
            <div className="stat-label">My Concepts</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon danger">📊</div>
            <div className="stat-value">—</div>
            <div className="stat-label">Avg. Performance</div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">📝</div>
              <div className="activity-content">
                <div className="activity-title">You have {myQuizzes.length} quizzes and {myConcepts.length} concepts</div>
                <div className="activity-meta">
                  <span className="date">Last updated just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleStartEditQuiz = (q) => {
    setEditingQuizId(q._id);
    setEditingQuiz({
      title: q.title || '',
      description: q.description || '',
      topic: q.topic || '',
      difficulty: q.difficulty || 'Beginner',
      duration: q.duration || 15,
    });
  };

  const handleSaveEditQuiz = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await api.put(`/quiz/${editingQuizId}`, editingQuiz);
      setEditingQuizId(null);
      setEditingQuiz(null);
      await fetchQuizzes();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm('Deactivate this quiz?')) return;
    try {
      setLoading(true);
      setError('');
      await api.delete(`/quiz/${id}`);
      await fetchQuizzes();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete quiz');
    } finally {
      setLoading(false);
    }
  };

  const renderQuizzes = () => (
    <div className="dashboard-card">
      <h3>My Quizzes</h3>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <button onClick={fetchQuizzes} disabled={loading} style={{ marginBottom: 12 }}>
        {loading ? 'Loading...' : 'Refresh'}
      </button>

      <div className="quiz-summary-grid">
        <div className="quiz-summary-card">
          <span className="quiz-summary-label">Beginner</span>
          <strong className="quiz-summary-value">{myQuizzes.filter(q => q.difficulty === 'Beginner').length}</strong>
          <span className="quiz-summary-caption">Aligned to foundation concepts</span>
        </div>
        <div className="quiz-summary-card">
          <span className="quiz-summary-label">Intermediate</span>
          <strong className="quiz-summary-value">{myQuizzes.filter(q => q.difficulty === 'Intermediate').length}</strong>
          <span className="quiz-summary-caption">Skill-building challenges</span>
        </div>
        <div className="quiz-summary-card">
          <span className="quiz-summary-label">Advanced</span>
          <strong className="quiz-summary-value">{myQuizzes.filter(q => q.difficulty === 'Advanced').length}</strong>
          <span className="quiz-summary-caption">Olympiad-style problems</span>
        </div>
      </div>

      <ul style={{ paddingLeft: 16 }}>
        {myQuizzes.map(q => (
          <li key={q._id} style={{ marginBottom: 8 }}>
            {editingQuizId === q._id ? (
              <form onSubmit={handleSaveEditQuiz} style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
                <input style={{ minWidth: 160 }} placeholder="Title" value={editingQuiz.title} onChange={e => setEditingQuiz({ ...editingQuiz, title: e.target.value })} required />
                <input style={{ minWidth: 220 }} placeholder="Description" value={editingQuiz.description} onChange={e => setEditingQuiz({ ...editingQuiz, description: e.target.value })} required />
                <input placeholder="Topic" value={editingQuiz.topic} onChange={e => setEditingQuiz({ ...editingQuiz, topic: e.target.value })} required />
                <select value={editingQuiz.difficulty} onChange={e => setEditingQuiz({ ...editingQuiz, difficulty: e.target.value })}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
                <input type="number" placeholder="Duration (min)" value={editingQuiz.duration} onChange={e => setEditingQuiz({ ...editingQuiz, duration: Number(e.target.value) })} min={1} />
                <button type="submit" disabled={loading}>Save</button>
                <button type="button" onClick={() => { setEditingQuizId(null); setEditingQuiz(null); }}>Cancel</button>
              </form>
            ) : (
              <>
                <strong>{q.title}</strong> — {q.topic} — {q.difficulty}
                <Link to={`/quiz/${q._id}/stats`} style={{ marginLeft: 8 }}>View Stats →</Link>
                <button style={{ marginLeft: 8 }} onClick={() => handleStartEditQuiz(q)}>Edit</button>
                <button style={{ marginLeft: 6, color: '#b91c1c' }} onClick={() => handleDeleteQuiz(q._id)}>Delete</button>
              </>
            )}
          </li>
        ))}
        {myQuizzes.length === 0 && <li>No quizzes yet.</li>}
      </ul>

      <div className="quiz-notes-panel">
        <h4>Quick Planning Notes</h4>
        <div className="quiz-notes-grid">
          <div className="quiz-note">
            <strong>Foundation (Beginner)</strong>
            <p>Target core misconceptions using simple recall + conceptual questions. Ideal topics: Periodic Trends, Atomic Structure, Basic Stoichiometry.</p>
          </div>
          <div className="quiz-note">
            <strong>Skill-Building (Intermediate)</strong>
            <p>Layer reasoning problems that require multi-step thinking. Great for Chemical Bonding, Equilibrium, Thermodynamics readiness checks.</p>
          </div>
          <div className="quiz-note">
            <strong>Stretch (Advanced)</strong>
            <p>Challenge gifted learners with olympiad-style items. Combine calculation + explanation prompts to probe depth of understanding.</p>
          </div>
        </div>
      </div>

      <h4 className="quiz-section-heading">Create Quiz</h4>
      <form onSubmit={createQuiz} className="quiz-create-form">
        <div className="quiz-create-grid">
          <input placeholder="Title" value={newQuiz.title} onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })} required />
          <input placeholder="Description" value={newQuiz.description} onChange={e => setNewQuiz({ ...newQuiz, description: e.target.value })} required />
          <input placeholder="Topic" value={newQuiz.topic} onChange={e => setNewQuiz({ ...newQuiz, topic: e.target.value })} required />
          <select value={newQuiz.difficulty} onChange={e => setNewQuiz({ ...newQuiz, difficulty: e.target.value })}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
          <input type="number" placeholder="Duration (min)" value={newQuiz.duration} onChange={e => setNewQuiz({ ...newQuiz, duration: Number(e.target.value) })} min={1} />
        </div>

        <div className="quiz-level-guidance">
          <div className="quiz-level-card">
            <span className="level-tag beginner">Beginner</span>
            <p>Focus on single-concept recall and recognition. Use visuals or guided prompts to scaffold weaker learners.</p>
          </div>
          <div className="quiz-level-card">
            <span className="level-tag intermediate">Intermediate</span>
            <p>Introduce two-step reasoning questions. Blend MCQs and short answers around lab scenarios or real-world applications.</p>
          </div>
          <div className="quiz-level-card">
            <span className="level-tag advanced">Advanced</span>
            <p>Integrate cross-topic synthesis. Invite students to justify answers with diagrams, reaction mechanisms, or energy profiles.</p>
          </div>
        </div>

        <div className="quiz-question-block">
          <h5>Question Builder</h5>
          <textarea placeholder="Question" value={newQuiz.questions[0].question} onChange={e => {
            const q = { ...newQuiz.questions[0], question: e.target.value };
            setNewQuiz({ ...newQuiz, questions: [q] });
          }} />
          {newQuiz.questions[0].options.map((opt, idx) => (
            <input key={idx} placeholder={`Option ${idx + 1}`} value={opt} onChange={e => {
              const opts = [...newQuiz.questions[0].options];
              opts[idx] = e.target.value;
              const q = { ...newQuiz.questions[0], options: opts };
              setNewQuiz({ ...newQuiz, questions: [q] });
            }} />
          ))}
          <label className="correct-index-label">
            Correct Index (0-3)
            <input type="number" min={0} max={3} value={newQuiz.questions[0].correct} onChange={e => {
              const q = { ...newQuiz.questions[0], correct: Number(e.target.value) };
              setNewQuiz({ ...newQuiz, questions: [q] });
            }} />
          </label>
          <textarea placeholder="Explanation" value={newQuiz.questions[0].explanation} onChange={e => {
            const q = { ...newQuiz.questions[0], explanation: e.target.value };
            setNewQuiz({ ...newQuiz, questions: [q] });
          }} />
        </div>

        <button type="submit" disabled={loading} className="quiz-create-submit">
          {loading ? 'Creating...' : 'Create Quiz'}
        </button>
      </form>
    </div>
  );

  const handleStartEditConcept = (c) => {
    setEditingConceptId(c._id);
    setEditingConcept({
      title: c.title || '',
      description: c.description || '',
      topic: c.topic || '',
      difficulty: c.difficulty || 'Beginner',
      estimatedTime: c.estimatedTime || 10,
    });
  };

  const handleSaveEditConcept = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await api.put(`/concept/${editingConceptId}`, editingConcept);
      setEditingConceptId(null);
      setEditingConcept(null);
      await fetchConcepts();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update concept');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConcept = async (id) => {
    if (!window.confirm('Deactivate this concept? (Admin only)')) return;
    try {
      setLoading(true);
      setError('');
      await api.delete(`/concept/${id}`);
      await fetchConcepts();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete concept');
    } finally {
      setLoading(false);
    }
  };

  const renderConcepts = () => (
    <div className="dashboard-card">
      <h3>My Concepts</h3>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <button onClick={fetchConcepts} disabled={loading} style={{ marginBottom: 12 }}>
        {loading ? 'Loading...' : 'Refresh'}
      </button>
      <ul style={{ paddingLeft: 16 }}>
        {concepts.filter(c => (c.createdBy?._id || c.createdBy) === user.id).map(c => (
          <li key={c._id} style={{ marginBottom: 8 }}>
            {editingConceptId === c._id ? (
              <form onSubmit={handleSaveEditConcept} style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
                <input style={{ minWidth: 160 }} placeholder="Title" value={editingConcept.title} onChange={e => setEditingConcept({ ...editingConcept, title: e.target.value })} required />
                <input style={{ minWidth: 220 }} placeholder="Description" value={editingConcept.description} onChange={e => setEditingConcept({ ...editingConcept, description: e.target.value })} required />
                <input placeholder="Topic" value={editingConcept.topic} onChange={e => setEditingConcept({ ...editingConcept, topic: e.target.value })} required />
                <select value={editingConcept.difficulty} onChange={e => setEditingConcept({ ...editingConcept, difficulty: e.target.value })}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
                <input type="number" placeholder="Estimated Time (min)" value={editingConcept.estimatedTime} onChange={e => setEditingConcept({ ...editingConcept, estimatedTime: Number(e.target.value) })} min={1} />
                <button type="submit" disabled={loading}>Save</button>
                <button type="button" onClick={() => { setEditingConceptId(null); setEditingConcept(null); }}>Cancel</button>
              </form>
            ) : (
              <>
                <strong>{c.title}</strong> — {c.topic} — {c.difficulty}
                <button style={{ marginLeft: 8 }} onClick={() => handleStartEditConcept(c)}>Edit</button>
                {user.role === 'admin' && (
                  <button style={{ marginLeft: 6, color: '#b91c1c' }} onClick={() => handleDeleteConcept(c._id)}>Delete</button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      <h4 style={{ marginTop: 24 }}>Create Concept</h4>
      <form onSubmit={createConcept} style={{ display: 'grid', gap: 8 }}>
        <input placeholder="Title" value={newConcept.title} onChange={e => setNewConcept({ ...newConcept, title: e.target.value })} required />
        <input placeholder="Description" value={newConcept.description} onChange={e => setNewConcept({ ...newConcept, description: e.target.value })} required />
        <input placeholder="Topic" value={newConcept.topic} onChange={e => setNewConcept({ ...newConcept, topic: e.target.value })} required />
        <select value={newConcept.difficulty} onChange={e => setNewConcept({ ...newConcept, difficulty: e.target.value })}>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
        <input type="number" placeholder="Estimated Time (min)" value={newConcept.estimatedTime} onChange={e => setNewConcept({ ...newConcept, estimatedTime: Number(e.target.value) })} min={1} />
        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Concept'}</button>
      </form>
    </div>
  );

  // Simple add-student form state
  const [newStudent, setNewStudent] = useState({ name: '', email: '' });
  const [successMessage, setSuccessMessage] = useState('');

  const addStudent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      await api.post('/user/students', newStudent);
      setNewStudent({ name: '', email: '' });
      setSuccessMessage('Student added successfully! An email with login details has been sent.');
      // Refresh derived list: merge assigned students with attempts-derived roster
      await fetchStudentsFromStats();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  const renderStudents = () => (
    <div className="dashboard-card">
      <h3>Students</h3>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {successMessage && <div style={{ color: 'green', marginBottom: 12 }}>{successMessage}</div>}

      {/* Add student */}
      <form onSubmit={addStudent} style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="Student name" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} />
        <input placeholder="Student email" type="email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} required />
        <button type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add Student'}</button>
      </form>

      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <button onClick={fetchStudentsFromStats} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>
      {(!studentsLoaded && loading) && <div>Loading students…</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Name</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Email</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Attempts</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Avg Score</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id}>
              <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{s.name || 'Student'}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{s.email || '—'}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{s.attempts}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{s.averageScore}%</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>
                <Link to={`/student/${s.id}/progress`}>View Progress →</Link>
              </td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: 12, color: '#6b7280' }}>No students yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'concepts':
        return renderConcepts();
      case 'quizzes':
        return renderQuizzes();
      case 'videos':
        return <VideoManager role="teacher" />;
      case 'exams':
        return <ExamManager role="teacher" />;
      case 'dependency-risk':
        return <ConceptDependencyRiskAnalyzer mode="teacher" />;
      case 'students':
        return renderStudents();
      case 'concept-library':
        return (
          <div className="dashboard-card">
            <h3>Concept Library</h3>
            <div style={{ paddingTop: 8 }}>
              {React.createElement(require('../Teacher/TeacherConceptLibrary').default)}
            </div>
          </div>
        );
      case 'periodic-table':
        return (
          <div className="dashboard-card">
            <h3>Periodic Table</h3>
            <div style={{ paddingTop: 8 }}>
              {React.createElement(require('../PeriodicTable/PeriodicTable').default)}
            </div>
          </div>
        );
      case 'concept-map':
        return (
          <div className="dashboard-card">
            <h3>Concept Maps</h3>
            <div style={{ paddingTop: 8 }}>
              {React.createElement(require('../Teacher/TeacherConceptMapManager').default)}
            </div>
          </div>
        );
      case 'molecule-animation':
        return (
          <div className="dashboard-card">
            <h3>Molecule Animation</h3>
            <div style={{ paddingTop: 8 }}>
              {React.createElement(require('../MoleculeAnimation/MoleculeAnimation').default)}
            </div>
          </div>
        );
      case 'chemistry-calculator':
        return (
          <div className="dashboard-card">
            <h3>Chemistry Calculator</h3>
            <div style={{ paddingTop: 8 }}>
              {React.createElement(require('../ChemistryCalculator/ChemistryCalculator').default)}
            </div>
          </div>
        );
      case 'chemical-equations':
        return (
          <div className="dashboard-card">
            <h3>Chemical Equations</h3>
            <div style={{ paddingTop: 8 }}>
              {React.createElement(require('../ChemicalEquations/ChemicalEquations').default)}
            </div>
          </div>
        );
      case 'leaderboard':
        return (
          <div className="dashboard-card">
            <h3>Leaderboard</h3>
            <div style={{ paddingTop: 8 }}>
              {React.createElement(require('../Gamification/Leaderboard').default)}
            </div>
          </div>
        );
      case 'performance-dashboard':
        return <TeacherPerformanceDashboard user={user} />;
      case 'learning-path':
        return (
          <div className="dashboard-card">
            <h3>Student Learning Paths</h3>
            <div style={{ paddingTop: 8 }}>
              <LearningPath role="teacher" />
            </div>
          </div>
        );
      case 'progress':
        return (
          <div className="dashboard-card">
            <h3>Student Progress Analytics</h3>
            <div style={{ paddingTop: 8 }}>
              <div className="teacher-progress-analytics">
                <div className="progress-summary">
                  <div className="progress-card">
                    <div className="progress-label">Students with Activity</div>
                    <div className="progress-value">{students.filter(s => s.attempts > 0).length}</div>
                  </div>
                  <div className="progress-card">
                    <div className="progress-label">Total Quiz Attempts</div>
                    <div className="progress-value">{students.reduce((sum, s) => sum + s.attempts, 0)}</div>
                  </div>
                  <div className="progress-card">
                    <div className="progress-label">Average Progress</div>
                    <div className="progress-value">
                      {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.averageScore, 0) / students.length) : 0}%
                    </div>
                  </div>
                </div>
                
                <div className="student-progress-list">
                  <h4>Student Progress Details</h4>
                  <div className="progress-table">
                    <div className="progress-header">
                      <span>Student</span>
                      <span>Attempts</span>
                      <span>Average Score</span>
                      <span>Last Activity</span>
                    </div>
                    {students.map(student => (
                      <div key={student.id} className="progress-row">
                        <span className="student-name">{student.name || 'Student'}</span>
                        <span className="attempts">{student.attempts}</span>
                        <span className="score">{student.averageScore}%</span>
                        <span className="activity">Recent</span>
                      </div>
                    ))}
                    {students.length === 0 && (
                      <div className="no-data">No student progress data available</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="dashboard-card">
            <h3>Advanced Analytics</h3>
            <div style={{ paddingTop: 8 }}>
              <div className="teacher-analytics">
                <div className="analytics-summary">
                  <div className="analytics-card">
                    <div className="analytics-label">Total Students</div>
                    <div className="analytics-value">{studentsLoaded ? students.length : '—'}</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-label">Total Quiz Attempts</div>
                    <div className="analytics-value">{students.reduce((sum, s) => sum + s.attempts, 0)}</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-label">Average Class Score</div>
                    <div className="analytics-value">
                      {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.averageScore, 0) / students.length) : 0}%
                    </div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-label">Active Quizzes</div>
                    <div className="analytics-value">{myQuizzes.length}</div>
                  </div>
                </div>
                
                <div className="student-performance-chart">
                  <h4>Student Performance by Topic</h4>
                  <div className="performance-bars">
                    {students.slice(0, 10).map((student, idx) => (
                      <div key={student.id} className="performance-bar-row">
                        <div className="student-name">{student.name || 'Student'}</div>
                        <div className="performance-bar-container">
                          <div 
                            className="performance-bar" 
                            style={{ width: `${student.averageScore}%` }}
                          ></div>
                          <span className="performance-score">{student.averageScore}%</span>
                        </div>
                        <div className="attempts-count">{student.attempts} attempts</div>
                      </div>
                    ))}
                    {students.length === 0 && (
                      <div className="no-data">No student data available yet</div>
                    )}
                  </div>
                </div>

                <div className="quiz-performance-grid">
                  <h4>Quiz Performance Overview</h4>
                  <div className="quiz-stats-grid">
                    <div className="quiz-stat-card">
                      <span className="quiz-stat-label">Beginner Quizzes</span>
                      <strong className="quiz-stat-value">{myQuizzes.filter(q => q.difficulty === 'Beginner').length}</strong>
                    </div>
                    <div className="quiz-stat-card">
                      <span className="quiz-stat-label">Intermediate Quizzes</span>
                      <strong className="quiz-stat-value">{myQuizzes.filter(q => q.difficulty === 'Intermediate').length}</strong>
                    </div>
                    <div className="quiz-stat-card">
                      <span className="quiz-stat-label">Advanced Quizzes</span>
                      <strong className="quiz-stat-value">{myQuizzes.filter(q => q.difficulty === 'Advanced').length}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'content':
        return <ContentManagement user={user} />;
      case 'subscription':
        return <SubscriptionPage user={{ role: 'teacher' }} />;
      case 'remediation':
        return <RemediationModule />;
      case 'ar-multimedia':
        return <ARMultimediaModule />;
      case 'revision':
        return <RevisionModule />;
      case 'periodic-table':
        return <PeriodicTable />;
      case 'chemical-equations':
        return <ChemicalEquations />;
      case 'chemistry-calculator':
        return <ChemistryCalculator />;
      case 'molecule-animation':
        return <MoleculeAnimation />;
      case 'gamification':
        return <Leaderboard />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="teacher-dashboard fade-in">
      {renderContent()}
    </div>
  );
};

export default TeacherDashboard;
