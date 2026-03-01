import React, { useEffect, useState } from 'react';
import api from '../../apiClient';
import ExamRunner from './ExamRunner';

const StudentExamSelector = () => {
  const [examId, setExamId] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <select value={examId} onChange={e=>setExamId(e.target.value)}>
          <option value="">Select scheduled exam…</option>
          {list.map(ex => <option key={ex._id} value={ex._id}>{ex.title}</option>)}
        </select>
        {loading && <span>Loading…</span>}
        {error && <span style={{ color: '#ef4444' }}>{error}</span>}
      </div>
      {examId && <ExamRunner examId={examId} onSubmitted={() => setExamId('')} />}
    </div>
  );
};

export default StudentExamSelector;

