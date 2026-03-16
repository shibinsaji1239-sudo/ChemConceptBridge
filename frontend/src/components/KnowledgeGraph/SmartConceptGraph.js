import React, { useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import api from '../../apiClient';
import './KnowledgeGraphVisualizer.css'; // Reuse existing styles

const SmartConceptGraph = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/concept-graph');
        setGraphData(data);
      } catch (err) {
        console.error('Error fetching concept graph:', err);
        setError('Failed to load the smart concept graph.');
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, []);

  if (loading) return <div className="loading-container">Loading Smart Concept Graph...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="smart-graph-container" style={{ width: '100%', height: '600px', background: '#f8fafc', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <div className="graph-header" style={{ padding: '1rem', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Dynamic Chemical Concept Graph (DCCG)</h2>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
          Self-learning knowledge graph showing dependency weights based on student performance.
        </p>
      </div>
      
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="name"
        nodeColor={() => '#3b82f6'}
        nodeRelSize={6}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.25}
        linkLabel="label"
        linkWidth={link => link.weight * 5}
        linkColor={link => link.weight > 0.7 ? '#ef4444' : '#94a3b8'}
        onNodeClick={node => console.log('Clicked node:', node)}
      />
      
      <div className="graph-legend" style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(255,255,255,0.9)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
          <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '50%', marginRight: '8px' }}></div>
          <span>Concept Node</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
          <div style={{ width: '20px', height: '2px', background: '#ef4444', marginRight: '8px' }}></div>
          <span>Strong Dependency (Critical)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '20px', height: '1px', background: '#94a3b8', marginRight: '8px' }}></div>
          <span>Normal Dependency</span>
        </div>
      </div>
    </div>
  );
};

export default SmartConceptGraph;
