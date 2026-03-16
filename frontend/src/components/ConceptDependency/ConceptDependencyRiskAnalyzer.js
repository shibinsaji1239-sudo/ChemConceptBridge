import React, { useEffect, useMemo, useState } from 'react';
import api from '../../apiClient';
import { FaUserGraduate, FaSyncAlt } from 'react-icons/fa';
import './ConceptDependencyRiskAnalyzer.css';

function getUserIdFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload?.id || payload?._id || payload?.userId || null;
  } catch {
    return null;
  }
}

function riskColor(level) {
  if (level === 'high') return '#ef4444';
  if (level === 'medium') return '#f59e0b';
  return '#10b981';
}

// Lightweight graph layout: place nodes in a circle, draw edges.
function circleLayout(nodes) {
  const R = 220;
  const cx = 320;
  const cy = 260;
  const n = Math.max(1, nodes.length);
  const byId = new Map();
  nodes.forEach((node, i) => {
    const a = (2 * Math.PI * i) / n;
    byId.set(node.id, {
      ...node,
      x: cx + R * Math.cos(a),
      y: cy + R * Math.sin(a)
    });
  });
  return byId;
}

export default function ConceptDependencyRiskAnalyzer({ mode = 'student' }) {
  const [graph, setGraph] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [selectedConceptId, setSelectedConceptId] = useState(null);
  
  // Teacher/Admin specific state
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('class'); // 'class' for aggregate
  const [loadingStudents, setLoadingStudents] = useState(false);

  const loggedInUserId = useMemo(() => getUserIdFromToken(), []);
  const isTeacherView = mode === 'teacher' || mode === 'admin';

  // Fetch students if in teacher mode
  useEffect(() => {
    if (isTeacherView) {
      const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
          const res = await api.get('/user/students');
          setStudents(res.data || []);
        } catch (e) {
          console.error('Failed to fetch students', e);
        } finally {
          setLoadingStudents(false);
        }
      };
      fetchStudents();
    }
  }, [isTeacherView]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const targetUserId = isTeacherView ? selectedStudentId : loggedInUserId;

      // Always load the concept graph first so the visualization is available
      // even if risk analysis fails for some reason.
      const graphRes = await api.get('/concept-dependency/graph');
      setGraph(graphRes.data);

      // Fetch risk analysis for the target student or class aggregate.
      let analysisData = null;

      if (targetUserId) {
        try {
          const analysisRes = await api.get(`/concept-dependency/risk-analysis/${targetUserId}`);
          analysisData = analysisRes.data;
        } catch (e) {
          const detail = e?.response?.data?.error || e?.response?.data?.message || e?.message || '';

          // Hide low-level Mongo ObjectId casting details from the UI and show a
          // friendlier message instead.
          if (detail && /Cast to ObjectId failed|Invalid student ID/i.test(detail)) {
            setError('Risk analysis is not available yet. Ask students to complete some quizzes first.');
          } else {
            setError(detail);
          }
        }
      }
      
      // If we got here without throwing, and we have graph data, clear any previous 
      // fatal errors (though non-fatal risk analysis error might still be set above)
      if (graphRes.data && !analysisData && !error) {
         // No analysis but graph loaded - usually means no quiz data
         setError('Risk analysis is not available yet. Ask students to complete some quizzes first.');
      } else if (analysisData) {
         setError(''); // Clear error if we have successful analysis
      }

      setAnalysis(analysisData);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load dependency graph';
      const detail = e?.response?.data?.error || '';
      setError(detail ? `${msg}: ${detail}` : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId]);

  const riskByConceptId = useMemo(() => {
    const map = new Map();
    (analysis?.riskAnalysis || []).forEach((r) => {
      map.set(r.concept.id.toString(), r);
    });
    return map;
  }, [analysis]);

  const nodePositions = useMemo(() => {
    if (!graph?.nodes) return new Map();
    return circleLayout(graph.nodes);
  }, [graph]);

  const selected = useMemo(() => {
    if (!selectedConceptId) return null;
    return riskByConceptId.get(selectedConceptId) || null;
  }, [riskByConceptId, selectedConceptId]);

  const topRisks = useMemo(() => {
    return (analysis?.riskAnalysis || []).slice(0, 8);
  }, [analysis]);

  if (loading && !graph) return <div className="cdr-card">Loading dependency risk analyzer…</div>;

  // If the graph failed to load at all, prefer showing the actual error over the
  // generic "No graph data" message so teachers understand what is wrong.
  if (!graph) {
    if (error) {
      return (
        <div className="cdr-card cdr-error">
          <h3 style={{ marginTop: 0, marginBottom: 4 }}>Risk Analyzer temporarily unavailable</h3>
          <p style={{ margin: 0, marginBottom: 4 }}>{error}</p>
          <p style={{ margin: 0, fontSize: 13, color: '#4b5563' }}>
            This usually means the concept graph could not be loaded from the server. Please check that the
            backend is running and that some concepts exist, then refresh this page.
          </p>
        </div>
      );
    }
    return <div className="cdr-card">No graph data available.</div>;
  }

  return (
    <div className="cdr-grid">
      <div className="cdr-card">
        {error && (
          <div className="cdr-error" style={{ marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 4 }}>Risk Analyzer temporarily unavailable</h3>
            <p style={{ margin: 0, marginBottom: 4 }}>{error}</p>
            <p style={{ margin: 0, fontSize: 13, color: '#4b5563' }}>
              This usually means there is not enough recent quiz activity from your class for us to analyse
              earlier attempts. Once students have completed a few quizzes, this panel will show concept-level
              risk insights based on their previous quiz history. You can then refresh this page to see the
              updated analysis.
            </p>
          </div>
        )}

        <div className="cdr-header">
          <div>
            <h3 style={{ margin: 0 }}>
              {isTeacherView && selectedStudentId === 'class' ? 'Class-wide Risk Analysis' : 'Concept Dependency Risk Analyzer'}
            </h3>
            <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 13 }}>
              {isTeacherView && selectedStudentId === 'class' 
                ? 'Aggregate risk map showing average student bottlenecks.'
                : 'Knowledge-graph view of prerequisites. Click a node to see predicted risk.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isTeacherView && (
              <div className="cdr-student-selector">
                <FaUserGraduate style={{ color: '#6366f1', marginRight: 8 }} />
                <select 
                  value={selectedStudentId} 
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="cdr-select"
                  disabled={loadingStudents}
                >
                  <option value="class">👥 Entire Class (Aggregate)</option>
                  <optgroup label="Individual Students">
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}
            <button className="cdr-btn" onClick={load} title="Refresh Data">
              <FaSyncAlt className={loading ? 'fa-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="cdr-legend">
          <span><span className="dot" style={{ background: '#10b981' }} /> Low risk</span>
          <span><span className="dot" style={{ background: '#f59e0b' }} /> Medium risk</span>
          <span><span className="dot" style={{ background: '#ef4444' }} /> High risk</span>
        </div>

        {seedMsg ? (<div className="cdr-muted" style={{ marginBottom: 8 }}>{seedMsg}</div>) : null}
        <div style={{ position: 'relative' }}>
          {loading && (
            <div style={{ 
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
              background: 'rgba(255,255,255,0.5)', zIndex: 10,
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}>
              Loading...
            </div>
          )}
          <svg className="cdr-svg" viewBox="0 0 640 520">
            {/* edges */}
            {(graph.edges || []).slice(0, 800).map((e, idx) => {
              const s = nodePositions.get(e.source);
              const t = nodePositions.get(e.target);
              if (!s || !t) return null;
              return (
                <line
                  key={idx}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={e.type === 'prerequisite' ? '#cbd5e1' : '#93c5fd'}
                  strokeWidth={e.type === 'prerequisite' ? 1 : 1.5}
                  opacity={0.7}
                />
              );
            })}

            {/* nodes */}
            {(graph.nodes || []).map((n) => {
              const p = nodePositions.get(n.id);
              if (!p) return null;
              const risk = riskByConceptId.get(n.id);
              const level = risk?.riskLevel || 'low';
              const fill = riskColor(level);
              const isSelected = selectedConceptId === n.id;

              return (
                <g key={n.id} onClick={() => setSelectedConceptId(n.id)} style={{ cursor: 'pointer' }}>
                  <circle cx={p.x} cy={p.y} r={isSelected ? 11 : 8} fill={fill} opacity={0.95} />
                  <circle cx={p.x} cy={p.y} r={isSelected ? 14 : 11} fill="none" stroke="#0f172a" strokeWidth={isSelected ? 2 : 0} opacity={0.25} />
                  <title>{n.title}</title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="cdr-card">
        <h3 style={{ marginTop: 0 }}>
          {selectedStudentId === 'class' ? 'Class-wide Predicted Risks' : 'Top Predicted Risks'}
        </h3>
        <p style={{ marginTop: 6, color: '#6b7280', fontSize: 13 }}>
          {selectedStudentId === 'class' 
            ? 'Concepts where the majority of students are predicted to struggle based on current class-wide mastery.'
            : 'Highest-risk concepts based on prerequisite mastery inferred from quiz performance.'}
        </p>

        {topRisks.length === 0 ? (
          <div className="cdr-muted">
            {selectedStudentId === 'class' 
              ? 'No aggregate data yet. Students need to attempt quizzes.' 
              : 'No risk data yet. Attempt a few quizzes to generate mastery signals.'}
          </div>
        ) : (
          <div className="cdr-risk-list">
            {topRisks.map((r) => (
              <button
                key={r.concept.id}
                className="cdr-risk-row"
                onClick={() => setSelectedConceptId(r.concept.id)}
              >
                <div className="cdr-risk-title">{r.concept.title}</div>
                <div className="cdr-risk-meta">
                  <span className="cdr-pill" style={{ background: `${riskColor(r.riskLevel)}22`, color: riskColor(r.riskLevel) }}>
                    {r.riskLevel.toUpperCase()}
                  </span>
                  <span className="cdr-muted">{Math.round(r.overallRisk * 100)}%</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="cdr-divider" />

        <h3 style={{ marginTop: 0 }}>Selected concept</h3>
        {!selected ? (
          <div className="cdr-muted">Click a node in the graph (left) to inspect risk.</div>
        ) : (
          <div>
            <div className="cdr-selected-title">{selected.concept.title}</div>
            <div className="cdr-selected-sub">
              Topic: <strong>{selected.concept.topic}</strong>
              {' • '}
              Risk: <strong style={{ color: riskColor(selected.riskLevel) }}>{Math.round(selected.overallRisk * 100)}%</strong>
              {' • '}
              Dependencies flagged: <strong>{selected.criticalDependencies}</strong>
            </div>
            <div className="cdr-note">
              {selectedStudentId === 'class' 
                ? `Interpretation: If students are generally weak in prerequisites for ${selected.concept.title}, the class probability of struggle here is high.`
                : `Interpretation: if you are weak in prerequisites of this concept, your probability of struggle here increases.`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

