import React, { useEffect, useState } from 'react';
import api from '../../apiClient';

const defaultQuestion = { type: 'mcq', text: '', options: ['', '', '', ''], correctIndex: 0, marks: 1, section: 'A' };

const ExamManager = ({ role = 'teacher' }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', topic: '', durationMinutes: 180, totalMarks: 100,
    negativeMarking: 0, randomize: true,
    schedule: { startTime: '', endTime: '' },
    sections: [{ name: 'A', weight: 0 }, { name: 'B', weight: 0 }, { name: 'C', weight: 0 }],
    questions: [ { ...defaultQuestion }, { type: 'descriptive', text: '', keywords: ['define','explain'], marks: 5, section: 'B' } ]
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/exams');
        setExams(data || []);
      } catch (e) {
        setExams([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateQuestion = (idx, patch) => {
    setForm(prev => ({ ...prev, questions: prev.questions.map((q, i) => i === idx ? { ...q, ...patch } : q) }));
  };

  const addQuestion = () => setForm(prev => ({ ...prev, questions: [...prev.questions, { ...defaultQuestion }] }));
  const removeQuestion = (idx) => setForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));

  const createExam = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const payload = { ...form };
      const { data } = await api.post('/exams', payload);
      setExams([data, ...exams]);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card">
      <h3>Smart Secure Examination & Evaluation</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <form onSubmit={createExam} className="exam-form" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input placeholder="Topic" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
          </div>
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <input type="number" placeholder="Duration (min)" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
            <input type="number" placeholder="Total Marks" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: Number(e.target.value) })} />
            <input type="number" placeholder="Negative Marking" value={form.negativeMarking} onChange={e => setForm({ ...form, negativeMarking: Number(e.target.value) })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.randomize} onChange={e => setForm({ ...form, randomize: e.target.checked })} /> Randomize
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input type="datetime-local" value={form.schedule.startTime} onChange={e => setForm({ ...form, schedule: { ...form.schedule, startTime: e.target.value } })} />
            <input type="datetime-local" value={form.schedule.endTime} onChange={e => setForm({ ...form, schedule: { ...form.schedule, endTime: e.target.value } })} />
          </div>

          <div style={{ marginTop: 8 }}>
            <h4>Questions</h4>
            {form.questions.map((q, idx) => (
              <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 80px', gap: 8 }}>
                  <input placeholder="Question text" value={q.text} onChange={e => updateQuestion(idx, { text: e.target.value })} />
                  <select value={q.type} onChange={e => updateQuestion(idx, { type: e.target.value })}>
                    <option value="mcq">MCQ</option>
                    <option value="descriptive">Descriptive</option>
                    <option value="numerical">Numerical</option>
                    <option value="equation">Equation</option>
                    <option value="diagram">Diagram Labeling</option>
                    <option value="assertion-reason">Assertion-Reason</option>
                    <option value="multi-step">Multi-step</option>
                  </select>
                  <input type="number" placeholder="Marks" value={q.marks || 1} onChange={e => updateQuestion(idx, { marks: Number(e.target.value) })} />
                  <input placeholder="Section" value={q.section || 'A'} onChange={e => updateQuestion(idx, { section: e.target.value })} />
                </div>

                {q.type === 'mcq' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 6 }}>
                    {(q.options || []).map((opt, i) => (
                      <input key={i} placeholder={`Option ${i+1}`} value={opt} onChange={e => updateQuestion(idx, { options: (q.options || []).map((o, j) => j===i ? e.target.value : o) })} />
                    ))}
                    <label style={{ gridColumn: '1 / -1' }}>Correct Index: <input type="number" value={q.correctIndex || 0} onChange={e => updateQuestion(idx, { correctIndex: Number(e.target.value) })} /></label>
                  </div>
                )}

                {q.type === 'descriptive' && (
                  <input placeholder="Keywords (comma separated)" value={(q.keywords || []).join(',')} onChange={e => updateQuestion(idx, { keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                )}

                {q.type === 'numerical' && (
                  <input type="number" placeholder="Correct numeric answer" value={q.numericAnswer ?? ''} onChange={e => updateQuestion(idx, { numericAnswer: Number(e.target.value) })} />
                )}

                {q.type === 'equation' && (
                  <input placeholder="Balanced equation answer" value={q.equationAnswer || ''} onChange={e => updateQuestion(idx, { equationAnswer: e.target.value })} />
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button type="button" onClick={() => removeQuestion(idx)}>Remove</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addQuestion}>+ Add Question</button>
          </div>

          {error && <div className="error-state">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Exam'}</button>
        </form>

        <div>
          <h4>Your Exams</h4>
          {loading && <div>Loading...</div>}
          {(exams || []).map(ex => (
            <div key={ex._id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{ex.title}</strong>
                <span>{ex.durationMinutes} min • {ex.totalMarks} marks</span>
              </div>
              <div style={{ color: '#6b7280' }}>{ex.topic}</div>
              <div style={{ fontSize: 12 }}>Scheduled: {ex.schedule?.startTime ? new Date(ex.schedule.startTime).toLocaleString() : '—'} → {ex.schedule?.endTime ? new Date(ex.schedule.endTime).toLocaleString() : '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamManager;

