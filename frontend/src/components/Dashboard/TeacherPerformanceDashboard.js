import React, { useEffect, useState } from 'react';
import './TeacherPerformanceDashboard.css';
import api from '../../apiClient';

const TeacherPerformanceDashboard = ({ user }) => {
  const [performance, setPerformance] = useState({
    totalStudents: 0,
    totalAttempts: 0,
    averageClassScore: 0,
    quizStats: { beginner: 0, intermediate: 0, advanced: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeacherPerformance();
  }, [user.id]);

  const fetchTeacherPerformance = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch teacher's quizzes
      const quizzesRes = await api.get('/quiz');
      const myQuizzes = (quizzesRes.data || []).filter(q => (q.createdBy?._id || q.createdBy) === user.id);
      
      // Fetch students assigned to teacher
      const studentsRes = await api.get('/user/students');
      const students = studentsRes.data || [];
      
      // Get quiz stats for each quiz
      const quizStatsPromises = myQuizzes.map(q => 
        api.get(`/quiz/${q._id}/stats`).then(r => ({ quiz: q, stats: r.data })).catch(() => ({ quiz: q, stats: null }))
      );
      const quizStats = await Promise.all(quizStatsPromises);
      
      // Calculate total attempts and average scores
      let totalAttempts = 0;
      let totalScore = 0;
      let scoreCount = 0;
      
      quizStats.forEach(({ stats }) => {
        if (stats && stats.studentPerformance) {
          stats.studentPerformance.forEach(sp => {
            totalAttempts += 1;
            totalScore += sp.score || 0;
            scoreCount += 1;
          });
        }
      });
      
      const averageClassScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
      
      // Calculate quiz difficulty breakdown
      const quizStatsByDifficulty = {
        beginner: myQuizzes.filter(q => q.difficulty === 'Beginner').length,
        intermediate: myQuizzes.filter(q => q.difficulty === 'Intermediate').length,
        advanced: myQuizzes.filter(q => q.difficulty === 'Advanced').length
      };
      
      setPerformance({
        totalStudents: students.length,
        totalAttempts,
        averageClassScore,
        quizStats: quizStatsByDifficulty
      });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/teacher', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Class_Performance_Summary.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Download failed', err);
      setError('Failed to download class report');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !performance.totalAttempts) return <div>Loading performance data...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="teacher-performance-dashboard">
      <div className="perf-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h2>Performance Dashboard</h2>
            <p>Track your class performance and quiz analytics</p>
          </div>
          <button 
            className="download-report-btn" 
            onClick={handleDownloadReport} 
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? 'Generating...' : '📊 Download Class Report'}
          </button>
        </div>
      </div>
      
      <div className="perf-summary">
        <div className="perf-card">
          <div className="perf-label">Total Students</div>
          <div className="perf-value">{performance.totalStudents}</div>
        </div>
        <div className="perf-card">
          <div className="perf-label">Total Attempts</div>
          <div className="perf-value">{performance.totalAttempts}</div>
        </div>
        <div className="perf-card">
          <div className="perf-label">Average Class Score</div>
          <div className="perf-value">{performance.averageClassScore}%</div>
        </div>
        <div className="perf-card">
          <div className="perf-label">Active Quizzes</div>
          <div className="perf-value">
            {performance.quizStats.beginner + performance.quizStats.intermediate + performance.quizStats.advanced}
          </div>
        </div>
      </div>
      
      <div className="perf-chart-section">
        <h3>Quiz Distribution by Difficulty</h3>
        <div className="perf-bar-chart">
          <div className="bar-row">
            <div className="bar-label">Beginner</div>
            <div className="bar-outer">
              <div className="bar-inner beginner" style={{ width: `${Math.max(10, performance.quizStats.beginner * 20)}%` }}></div>
              <span className="bar-score">{performance.quizStats.beginner}</span>
            </div>
          </div>
          <div className="bar-row">
            <div className="bar-label">Intermediate</div>
            <div className="bar-outer">
              <div className="bar-inner intermediate" style={{ width: `${Math.max(10, performance.quizStats.intermediate * 20)}%` }}></div>
              <span className="bar-score">{performance.quizStats.intermediate}</span>
            </div>
          </div>
          <div className="bar-row">
            <div className="bar-label">Advanced</div>
            <div className="bar-outer">
              <div className="bar-inner advanced" style={{ width: `${Math.max(10, performance.quizStats.advanced * 20)}%` }}></div>
              <span className="bar-score">{performance.quizStats.advanced}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherPerformanceDashboard;
