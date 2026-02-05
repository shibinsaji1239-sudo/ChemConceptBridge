import React, { useEffect, useMemo, useState } from 'react';
import api from '../../apiClient';
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

  const userId = useMemo(() => getUserIdFromToken(), []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [graphRes, analysisRes] = await Promise.all([
        api.get('/concept-dependency/graph'),
        userId ? api.get(`/concept-dependency/risk-analysis/${userId}`) : Promise.resolve({ data: null })
      ]);
      setGraph(graphRes.data);
      setAnalysis(analysisRes.data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load dependency graph');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  if (loading) return <div className="cdr-card">Loading dependency risk analyzer…</div>;
  if (error) return <div className="cdr-card cdr-error">{error}</div>;
  if (!graph) return <div className="cdr-card">No graph data available.</div>;

  return (
    <div className="cdr-grid">
      <div className="cdr-card">
        <div className="cdr-header">
          <div>
            <h3 style={{ margin: 0 }}>Concept Dependency Risk Analyzer</h3>
            <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 13 }}>
              Knowledge-graph view of prerequisites. Click a node to see predicted risk.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cdr-btn" onClick={load}>Refresh</button>
            <button
              className="cdr-btn"
              disabled={seeding}
              onClick={async () => {
                try {
                  setSeeding(true);
                  setSeedMsg('');
                  const res = await api.post('/quiz/seed-attempts');
                  setSeedMsg(`${res.data.attemptsCreated || 0} attempts created`);
                  await load();
                } catch (e) {
                  setSeedMsg('Failed to seed attempts');
                } finally {
                  setSeeding(false);
                }
              }}
            >
              {seeding ? 'Seeding…' : 'Seed sample attempts'}
            </button>
          </div>
        </div>

        <div className="cdr-legend">
          <span><span className="dot" style={{ background: '#10b981' }} /> Low risk</span>
          <span><span className="dot" style={{ background: '#f59e0b' }} /> Medium risk</span>
          <span><span className="dot" style={{ background: '#ef4444' }} /> High risk</span>
        </div>

        {seedMsg ? (<div className="cdr-muted" style={{ marginBottom: 8 }}>{seedMsg}</div>) : null}
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

      <div className="cdr-card">
        <h3 style={{ marginTop: 0 }}>Top predicted risks</h3>
        <p style={{ marginTop: 6, color: '#6b7280', fontSize: 13 }}>
          Highest-risk concepts based on prerequisite mastery inferred from quiz performance.
        </p>

        {topRisks.length === 0 ? (
          <div className="cdr-muted">No risk data yet. Attempt a few quizzes to generate mastery signals.</div>
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
              Interpretation: if you are weak in prerequisites of this concept, your probability of struggle here increases.
              For a viva: this is a graph-based prerequisite propagation model over a knowledge graph.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

