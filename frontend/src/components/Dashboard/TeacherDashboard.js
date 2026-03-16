import React, { useEffect, useMemo, useState } from 'react';
import './TeacherDashboard.css';
import api from '../../apiClient';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ContentManagement from './ContentManagement';
import SubscriptionPage from '../../pages/SubscriptionPage';
import RevisionModule from '../Revision/RevisionModule';
import PeriodicTable from '../PeriodicTable/PeriodicTable';
import ChemicalEquations from '../ChemicalEquations/ChemicalEquations';
import ChemistryCalculator from '../ChemistryCalculator/ChemistryCalculator';
import MoleculeAnimation from '../AR/MoleculeAnimation';
import Leaderboard from '../Gamification/Leaderboard';
import LabSimulation from '../LabSimulation/LabSimulation';
import ReactionVisualizer from '../ReactionVisualizer/ReactionVisualizer';
import SmartConceptGraph from '../KnowledgeGraph/SmartConceptGraph';
import ConceptPages from '../Concepts/ConceptPages';
import ProgressTracker from '../Progress/ProgressTracker';
import PerformanceDashboard from '../Progress/PerformanceDashboard';
import StudentExamSelector from '../Exams/StudentExamSelector';
import ExamManager from '../Exams/ExamManager';
import VideoManager from '../Videos/VideoManager';
import TeacherQuizManager from './TeacherQuizManager';
import TeacherPerformanceDashboard from './TeacherPerformanceDashboard';
import ConceptDependencyRiskAnalyzer from '../ConceptDependency/ConceptDependencyRiskAnalyzer';
import LearningPath from '../Progress/LearningPath';
import ARMultimediaModule from '../AR/ARMultimediaModule';
import RemediationModule from '../Remediation/RemediationModule';
import KnowledgeGraphVisualizer from '../KnowledgeGraph/KnowledgeGraphVisualizer';
import ConfidenceMeter from '../Progress/ConfidenceMeter';

const TeacherDashboard = ({ activeTab, setActiveTab, user }) => {
  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [conceptGraph, setConceptGraph] = useState({ nodes: [], links: [] });
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  // Form states for concepts
  const [newConcept, setNewConcept] = useState({
    title: '', description: '', topic: '', difficulty: 'Beginner', estimatedTime: 10
  });
  const [editingConceptId, setEditingConceptId] = useState(null);
  const [editingConcept, setEditingConcept] = useState(null);

  const myQuizzes = useMemo(() => quizzes.filter(q => (q.createdBy?._id || q.createdBy) === user.id), [quizzes, user.id]);

  const fetchQuizzes = async () => {
    try {
      const { data } = await api.get('/quiz');
      setQuizzes(data || []);
    } catch (e) {
      console.error('Failed to load quizzes', e);
    }
  };

  const fetchConcepts = async () => {
    try {
      const { data } = await api.get('/concept');
      setConcepts(data || []);
    } catch (e) {
      console.error('Failed to load concepts', e);
    }
  };

  const fetchStudentsFromStats = async () => {
    try {
      setLoading(true);
      const assignedRes = await api.get('/user/students');
      const assigned = assignedRes.data || [];
      const map = new Map();
      assigned.forEach(s => {
        const sid = String(s._id || s.id);
        map.set(sid, { id: sid, name: s.name, email: s.email, attempts: 0, totalScore: 0 });
      });

      const teacherQuizzes = quizzes.length ? quizzes.filter(q => (q.createdBy?._id || q.createdBy) === user.id) : [];
      const statsResponses = await Promise.all(
        teacherQuizzes.map(q => api.get(`/quiz/${q._id}/stats`).then(r => r.data).catch(() => null))
      );

      statsResponses.forEach((stats) => {
        if (!stats) return;
        (stats.studentPerformance || []).forEach(sp => {
          const sid = String(sp.student?._id || sp.student);
          if (map.has(sid)) {
            const prev = map.get(sid);
            prev.attempts += 1;
            prev.totalScore += sp.score;
            map.set(sid, prev);
          }
        });
      });

      setStudents(Array.from(map.values()).map(s => ({
        ...s,
        averageScore: s.attempts ? Math.round(s.totalScore / s.attempts) : 0
      })));
      setStudentsLoaded(true);
    } catch (e) {
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchConcepts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if ((activeTab === 'students' || activeTab === 'progress') && !studentsLoaded) {
      fetchStudentsFromStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
            <div className="stat-value">
              {students.length > 0 ? Math.round(students.reduce((s, a) => s + a.averageScore, 0) / students.length) : '0'}%
            </div>
            <div className="stat-label">Avg. Score</div>
          </div>
        </div>
        <div className="dashboard-card">
          <h3>Welcome, {user.name}</h3>
          <p>Manage your chemistry classes, generate AI quizzes, and track student progress from here.</p>
        </div>
      </div>
    );
  };

  const renderStudents = () => (
    <div className="dashboard-card">
      <h3>Student Roster</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
            <th style={{ padding: '12px' }}>Name</th>
            <th style={{ padding: '12px' }}>Email</th>
            <th style={{ padding: '12px' }}>Attempts</th>
            <th style={{ padding: '12px' }}>Avg Score</th>
            <th style={{ padding: '12px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px' }}>{s.name}</td>
              <td style={{ padding: '12px' }}>{s.email}</td>
              <td style={{ padding: '12px' }}>{s.attempts}</td>
              <td style={{ padding: '12px' }}>{s.averageScore}%</td>
              <td style={{ padding: '12px' }}>
                <Link to={`/student/${s.id}/progress`} className="text-blue-600">View Progress</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'concepts': return <ConceptPages />;
      case 'quizzes': return <TeacherQuizManager user={user} />;
      case 'revision': return <RevisionModule />;
      case 'progress': return <ProgressTracker />;
      case 'performance-dashboard': return <TeacherPerformanceDashboard teacherId={user.id} />;
      case 'confidence': return <ConfidenceMeter />;
      case 'exams':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <ExamManager role="teacher" />
            <div className="dashboard-card">
              <h3>Preview: Student Exam View</h3>
              <StudentExamSelector />
            </div>
          </div>
        );
      case 'students': return renderStudents();
      case 'content': return <ContentManagement user={user} />;
      case 'subscription': return <SubscriptionPage user={user} />;
      case 'periodic-table': return <PeriodicTable />;
      case 'chemical-equations': return <ChemicalEquations />;
      case 'chemistry-calculator': return <ChemistryCalculator />;
      case 'molecule-animation': return <MoleculeAnimation />;
      case 'lab-simulation':
      case 'chemistry-sandbox': return <LabSimulation role="teacher" />;
      case 'reaction-visualizer': return <ReactionVisualizer />;
      case 'smart-graph': return <SmartConceptGraph />;
      case 'gamification':
      case 'leaderboard': return <Leaderboard />;
      case 'learning-path': return <LearningPath role="teacher" />;
      case 'dependency-risk': return <ConceptDependencyRiskAnalyzer mode="teacher" />;
      case 'ar-multimedia': return <ARMultimediaModule />;
      case 'remediation': return <RemediationModule />;
      case 'concept-map': return <KnowledgeGraphVisualizer />;
      case 'videos': return <VideoManager role="teacher" />;
      default: return renderOverview();
    }
  };

  return (
    <div className="teacher-dashboard">
      {renderContent()}
    </div>
  );
};

export default TeacherDashboard;
