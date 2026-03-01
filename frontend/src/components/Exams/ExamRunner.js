import React, { useEffect, useRef, useState } from 'react';
import api from '../../apiClient';

const ExamRunner = ({ examId, onSubmitted }) => {
  const [attemptId, setAttemptId] = useState(null);
  const [exam, setExam] = useState(null);
  const [responses, setResponses] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  const logEvent = async (event) => {
    try {
      if (!attemptId) return;
      await api.post(`/exams/${examId}/attempt/${attemptId}/log`, { event });
    } catch {}
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post(`/exams/${examId}/attempt/start`);
        setAttemptId(data.attemptId);
        setExam(data.exam);
        setTimeLeft((data.exam?.durationMinutes || 0) * 60);
        // Secure mode
        try { await document.documentElement.requestFullscreen(); } catch {}
        const onVis = () => { if (document.hidden) logEvent('tab-switch'); };
        const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v')) { e.preventDefault(); logEvent('copy-paste'); } };
        const onFs = () => { if (!document.fullscreenElement) logEvent('fullscreen-exit'); };
        document.addEventListener('visibilitychange', onVis);
        document.addEventListener('keydown', onKey);
        document.addEventListener('fullscreenchange', onFs);
        return () => {
          document.removeEventListener('visibilitychange', onVis);
          document.removeEventListener('keydown', onKey);
          document.removeEventListener('fullscreenchange', onFs);
        };
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to start exam');
      }
    })();
  }, [examId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && exam && attemptId) {
      handleSubmit();
    }
  }, [timeLeft]);

  const setResponse = (qid, value) => setResponses(prev => ({ ...prev, [qid]: value }));

  const handleSubmit = async () => {
    try {
      const payload = {
        responses: Object.entries(responses).map(([questionId, response]) => ({ questionId, response, timeSpentSec: 0 }))
      };
      const { data } = await api.post(`/exams/${examId}/attempt/${attemptId}/submit`, payload);
      if (onSubmitted) onSubmitted(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Submit failed');
    }
  };

  if (error) return <div className="error-state">{error}</div>;
  if (!exam) return <div>Loading exam...</div>;

  const formatTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div className="exam-runner" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="exam-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>{exam.title}</h3>
          <div style={{ color: '#64748b' }}>{exam.topic}</div>
        </div>
        <div style={{ fontWeight: 700 }}>⏱️ {formatTime(timeLeft)}</div>
      </div>

      {(exam.questions || []).map((q, idx) => (
        <div key={q._id} className="question-card" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Q{idx+1} ({q.marks} marks)</strong>
            <span>Section {q.section}</span>
          </div>
          <div style={{ marginTop: 6 }}>{q.text}</div>

          {q.type === 'mcq' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              {(q.options || []).map((opt, i) => (
                <label key={i} style={{ display: 'flex', gap: 6 }}>
                  <input type="radio" name={`q_${q._id}`} checked={responses[q._id] === i} onChange={() => setResponse(q._id, i)} /> {opt}
                </label>
              ))}
            </div>
          )}

          {q.type === 'descriptive' && (
            <textarea placeholder="Type your answer" value={responses[q._id] || ''} onChange={e => setResponse(q._id, e.target.value)} style={{ width: '100%', minHeight: 80 }} />
          )}

          {q.type === 'numerical' && (
            <input type="number" placeholder="Enter number" value={responses[q._id] ?? ''} onChange={e => setResponse(q._id, Number(e.target.value))} />
          )}

          {q.type === 'equation' && (
            <input placeholder="Enter balanced equation" value={responses[q._id] || ''} onChange={e => setResponse(q._id, e.target.value)} />
          )}
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={handleSubmit}>Submit Exam</button>
      </div>
    </div>
  );
};

export default ExamRunner;

