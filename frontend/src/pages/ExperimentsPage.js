import React, { useEffect, useState } from 'react';
import api from '../apiClient';
import { Link } from 'react-router-dom';

const ExperimentsPage = () => {
  const [expsByClass, setExpsByClass] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/experiments');
        const exps = res.data || [];
        
        // Group by classLevel
        const grouped = exps.reduce((acc, exp) => {
          const lvl = exp.classLevel || 'Other';
          if (!acc[lvl]) acc[lvl] = [];
          acc[lvl].push(exp);
          return acc;
        }, {});
        
        setExpsByClass(grouped);
      } catch (err) {
        console.error('Could not load experiments', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div>Loading experiments…</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Available Virtual Labs</h2>
      
      {Object.keys(expsByClass).sort((a,b) => (a === 'Other' ? 1 : b === 'Other' ? -1 : a - b)).map(lvl => (
        <div key={lvl} style={{ marginTop: 24 }}>
          <h3 style={{ borderBottom: '2px solid #6366f1', paddingBottom: 8, color: '#334155' }}>
            {lvl === 'Other' ? 'General Experiments' : `Class ${lvl} Experiments`}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 12 }}>
            {expsByClass[lvl].map(e => (
              <div key={e._id} style={{ border: '1px solid #e2e8f0', padding: 16, borderRadius: 8, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>{e.title}</h4>
                <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: 16 }}>{e.description}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/experiments/${e._id}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: '#6366f1', color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Open Lab</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExperimentsPage;
