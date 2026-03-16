import React, { useEffect, useState } from 'react';
import api from '../../apiClient';
import ExamRunner from './ExamRunner';

const StudentExamSelector = () => {
  const [examId, setExamId] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/exams');
        setList(data || []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load exams');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getExamStatus = (ex) => {
    if (!ex.schedule?.startTime) return { label: 'Ready', disabled: false };
    const start = new Date(ex.schedule.startTime);
    const end = ex.schedule.endTime ? new Date(ex.schedule.endTime) : null;
    
    if (now < start) return { label: `Starts at ${start.toLocaleTimeString()}`, disabled: true };
    if (end && now > end) return { label: 'Expired', disabled: true };
    return { label: 'Live Now', disabled: false };
  };

  return (
    <div className="student-exam-selector">
      <div style={{ display:'flex', flexDirection: 'column', gap:10 }}>
        {list.length === 0 && !loading && <p style={{ color: '#64748b' }}>No scheduled exams found.</p>}
        {list.map(ex => {
          const status = getExamStatus(ex);
          return (
            <div key={ex._id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px',
              background: ex._id === examId ? '#f0f9ff' : 'white',
              border: `1px solid ${ex._id === examId ? '#7dd3fc' : '#e2e8f0'}`,
              borderRadius: '8px'
            }}>
              <div>
                <strong style={{ display: 'block' }}>{ex.title}</strong>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{ex.topic} • {ex.durationMinutes} min</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ 
                  fontSize: '11px', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  background: status.disabled ? '#f1f5f9' : '#dcfce7',
                  color: status.disabled ? '#64748b' : '#166534'
                }}>
                  {status.label}
                </span>
                <button 
                  onClick={() => setExamId(ex._id)} 
                  disabled={status.disabled}
                  className="btn btn-primary btn-sm"
                  style={{ opacity: status.disabled ? 0.5 : 1 }}
                >
                  {ex._id === examId ? 'Selected' : 'Join'}
                </button>
              </div>
            </div>
          );
        })}
        {loading && <span>Loading…</span>}
        {error && <span style={{ color: '#ef4444' }}>{error}</span>}
      </div>
      
      {examId && (
        <div style={{ marginTop: '20px', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
          <h4>Exam Session: {list.find(e => e._id === examId)?.title}</h4>
          <ExamRunner examId={examId} onSubmitted={() => setExamId('')} />
        </div>
      )}
    </div>
  );
};

export default StudentExamSelector;

