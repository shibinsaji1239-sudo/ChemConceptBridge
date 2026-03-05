import React, { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const ItemTypes = { EQUIPMENT: 'equipment' };

const BuretteSVG = ({ level, reagent }) => {
  const fillHeight = (level / 50) * 140;
  return (
    <svg width="40" height="180" viewBox="0 0 40 180" style={{ display: 'block', margin: '0 auto' }}>
      <rect x="15" y="10" width="10" height="140" fill="none" stroke="#444" strokeWidth="1" />
      {reagent && <rect x="16" y={10 + (140 - fillHeight)} width="8" height={fillHeight} fill="rgba(173, 216, 230, 0.4)" />}
      {[0, 10, 20, 30, 40, 50].map((v) => (
        <line key={v} x1="15" y1={10 + (v / 50) * 140} x2="20" y2={10 + (v / 50) * 140} stroke="#444" strokeWidth="0.5" />
      ))}
      <path d="M15 150 L25 150 L20 170 Z" fill="none" stroke="#444" />
      <rect x="18" y="155" width="4" height="10" fill="#444" />
    </svg>
  );
};

const FlaskSVG = ({ volume, color, hasReagent }) => {
  const baseHeight = 110;
  const fillLevel = hasReagent ? Math.min(50, 15 + (volume / 250) * 80) : 0;
  return (
    <svg width="100" height="120" viewBox="0 0 100 120" style={{ display: 'block', margin: '0 auto' }}>
      <path
        d="M40 10 L60 10 L65 50 L90 100 A10 10 0 0 1 80 115 L20 115 A10 10 0 0 1 10 100 L35 50 Z"
        fill="none"
        stroke="#333"
        strokeWidth="2"
      />
      {hasReagent && (
        <path
          d={`M${35 + (fillLevel / 100) * 15} ${115 - fillLevel} L${65 - (fillLevel / 100) * 15} ${115 - fillLevel} L90 100 A10 10 0 0 1 80 115 L20 115 A10 10 0 0 1 10 100 Z`}
          fill={color}
          opacity="0.8"
        />
      )}
    </svg>
  );
};

const EXPERIMENTS = {
  NAOH_HCL: {
    id: 'naoh_hcl',
    title: 'Estimation of NaOH using standard HCl',
    titrant: 'HCl',
    analyte: 'NaOH',
    indicator: 'Phenolphthalein',
    titrantNormality: 0.1014,
    analyteVolume: 20,
    analyteEqWeight: 40,
    colorMap: (pH) => (pH > 8.2 ? 'rgba(255, 105, 180, 0.6)' : 'rgba(255, 255, 255, 0.2)'),
    endpointDesc: 'Pink to Colorless',
    stoichiometry: 1
  },
  NA2CO3_H2SO4: {
    id: 'na2co3_h2so4',
    title: 'Estimation of Na2CO3 using standard H2SO4',
    titrant: 'H2SO4',
    analyte: 'Na2CO3',
    indicator: 'Methyl Orange',
    titrantNormality: 0.0989,
    analyteVolume: 20,
    analyteEqWeight: 53,
    colorMap: (pH) => (pH > 4.4 ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 69, 0, 0.6)'),
    endpointDesc: 'Golden Yellow to Orange Red',
    stoichiometry: 1
  }
};

const LabSimulation = () => {
  const [dnd, setDnd] = useState({ loading: true });
  const [activeExp, setActiveExp] = useState(EXPERIMENTS.NAOH_HCL);
  const [titrantVol, setTitrantVol] = useState(0);
  const [isPouring, setIsPouring] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [droppedItems, setDroppedItems] = useState({});
  const [observations, setObservations] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([import('react-dnd'), import('react-dnd-html5-backend')])
      .then(([dndLib, backendLib]) => {
        if (!mounted) return;
        setDnd({
          loading: false,
          DndProvider: dndLib.DndProvider,
          useDrag: dndLib.useDrag,
          useDrop: dndLib.useDrop,
          HTML5Backend: backendLib.HTML5Backend,
        });
      })
      .catch(() => {
        if (!mounted) return;
        setDnd({ loading: false, error: true });
      });
    return () => { mounted = false; };
  }, []);

  const guides = [
    `Experiment: ${activeExp.title}. Rinse the burette with ${activeExp.titrant} and pipette with ${activeExp.analyte}.`,
    `Drag the Burette and Conical Flask to the workspace to set up your equipment.`,
    `Fill the Burette with ${activeExp.titrant} and the Conical Flask with ${activeExp.analyte} by dragging them from the inventory.`,
    `Add ${activeExp.indicator} indicator to the flask to observe the end point color change.`,
    `Titrate by adding ${activeExp.titrant} dropwise. Watch the color and pH until the end point (${activeExp.endpointDesc}).`,
    `Note the concordant value and calculate the mass of ${activeExp.analyte} in the 100 mL solution.`
  ];

  const currentPH = useMemo(() => {
    const v_acid = activeExp.titrant === 'HCl' || activeExp.titrant === 'H2SO4' ? titrantVol : 0;
    const v_base = 20;
    const n_acid = activeExp.titrantNormality;
    const n_base = 0.1;
    const moles_acid = v_acid * n_acid;
    const moles_base = v_base * n_base;
    if (moles_base > moles_acid) {
      const remaining_oh = (moles_base - moles_acid) / (v_acid + v_base);
      return 14 + Math.log10(Math.max(1e-14, remaining_oh));
    } else {
      const remaining_h = (moles_acid - moles_base) / (v_acid + v_base);
      return -Math.log10(Math.max(1e-14, remaining_h));
    }
  }, [titrantVol, activeExp]);

  const handleDrop = (itemType, name) => {
    setDroppedItems(prev => {
      const newItems = { ...prev, [name]: true };
      
      // Step 1: Drag equipment
      if (guideStep === 1 && newItems['Burette'] && newItems['Conical Flask']) {
        setGuideStep(2);
      }
      // Step 2: Add reagents
      else if (guideStep === 2 && newItems[activeExp.titrant] && newItems[activeExp.analyte]) {
        setGuideStep(3);
      }
      // Step 3: Add indicator
      else if (guideStep === 3 && newItems[activeExp.indicator]) {
        setGuideStep(4);
      }
      
      return newItems;
    });
  };

  const addTitrant = (amount) => {
    setIsPouring(true);
    setTitrantVol(prev => Math.min(50, prev + amount));
    setTimeout(() => setIsPouring(false), 500);
  };

  const recordObservation = () => {
    setObservations(prev => [...prev, { vol: titrantVol.toFixed(2), id: prev.length + 1 }]);
  };

  const resetExperiment = () => {
    setTitrantVol(0);
    setDroppedItems({});
    setGuideStep(0);
    setObservations([]);
  };

  const chartData = {
    labels: Array.from({ length: 51 }, (_, i) => i),
    datasets: [{
      label: 'pH Value',
      data: Array.from({ length: 51 }, (_, i) => {
        if (i > titrantVol) return null;
        const v_acid = i;
        const v_base = 20;
        const n_acid = activeExp.titrantNormality;
        const n_base = 0.1;
        const moles_acid = v_acid * n_acid;
        const moles_base = v_base * n_base;
        if (moles_base > moles_acid) {
          const remaining_oh = (moles_base - moles_acid) / (v_acid + v_base);
          return 14 + Math.log10(Math.max(1e-14, remaining_oh));
        } else {
          const remaining_h = (moles_acid - moles_base) / (v_acid + v_base);
          return -Math.log10(Math.max(1e-14, remaining_h));
        }
      }),
      borderColor: '#6366f1',
      tension: 0.4,
      pointRadius: 0
    }]
  };

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        y: { min: 0, max: 14, title: { display: true, text: 'pH' } },
        x: { title: { display: true, text: 'Titrant Volume (mL)' } }
      }
    }),
    []
  );

  const reagents = [
    { name: 'HCl (0.1 M)', key: 'HCl' },
    { name: 'NaOH (0.1 M)', key: 'NaOH' },
    { name: 'Phenolphthalein', key: 'PHTH' },
  ];

  if (dnd.loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Virtual Lab...</div>;
  if (dnd.error) return <div style={{ padding: 40, textAlign: 'center', color: '#d00' }}>Error loading drag-and-drop components.</div>;

  const { DndProvider, HTML5Backend } = dnd;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="dashboard-card" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>Virtual Lab Sandbox: {activeExp.title}</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <select 
              value={activeExp.id} 
              onChange={(e) => {
                const exp = Object.values(EXPERIMENTS).find(ex => ex.id === e.target.value);
                setActiveExp(exp);
                resetExperiment();
              }}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', outline: 'none' }}
            >
              {Object.values(EXPERIMENTS).map(exp => (
                <option key={exp.id} value={exp.id}>{exp.title}</option>
              ))}
            </select>
            <button 
              onClick={resetExperiment}
              style={{ padding: '8px 16px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Reset Lab
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 20 }}>
          {/* Inventory */}
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#334155' }}>Inventory</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <Equipment name="Burette" dnd={dnd} />
              <Equipment name="Conical Flask" dnd={dnd} />
              <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }} />
              <Equipment name={activeExp.titrant} type="reagent" dnd={dnd} />
              <Equipment name={activeExp.analyte} type="reagent" dnd={dnd} />
              <Equipment name={activeExp.indicator} type="indicator" dnd={dnd} />
            </div>
          </div>

          {/* Workbench */}
          <div style={{ position: 'relative', height: 600, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 12, left: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.9)', borderRadius: 6, border: '1px solid #e2e8f0', zIndex: 10, fontSize: '0.9rem' }}>
              <div>Current pH: <strong style={{ color: '#6366f1' }}>{currentPH.toFixed(2)}</strong></div>
              <div>Titrant Added: <strong>{titrantVol.toFixed(2)} mL</strong></div>
            </div>

            <Workspace droppedItems={droppedItems} onDrop={handleDrop} isPouring={isPouring} currentPH={currentPH} activeExp={activeExp} titrantVol={titrantVol} dnd={dnd} />
            
            {/* Controls Overlay */}
            {droppedItems[activeExp.indicator] && (
              <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10, padding: 16, background: 'rgba(255,255,255,0.95)', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <button onClick={() => addTitrant(0.05)} style={controlBtnStyle}>Add Drop</button>
                <button onClick={() => addTitrant(1.0)} style={controlBtnStyle}>Add 1.0 mL</button>
                <button onClick={() => addTitrant(5.0)} style={controlBtnStyle}>Add 5.0 mL</button>
                <button onClick={recordObservation} style={{ ...controlBtnStyle, background: '#10b981' }}>Record Reading</button>
              </div>
            )}
          </div>

          {/* Analysis & Observations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, marginBottom: 12, color: '#334155' }}>Observations</div>
              <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                {observations.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>No readings recorded yet</div>
                ) : (
                  <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: 4 }}>Trial</th>
                        <th style={{ textAlign: 'right', padding: 4 }}>Vol (mL)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {observations.map(obs => (
                        <tr key={obs.id} style={{ borderBottom: '1px dotted #e2e8f0' }}>
                          <td style={{ padding: 4 }}>{obs.id}</td>
                          <td style={{ textAlign: 'right', padding: 4 }}>{obs.vol}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div style={{ height: 150 }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            <div style={{ padding: 16, background: '#6366f1', color: '#fff', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Guided Step {guideStep + 1}</div>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.5, opacity: 0.9 }}>{guides[guideStep]}</div>
              {guideStep < guides.length - 1 && (
                <button 
                  onClick={() => setGuideStep(s => s + 1)}
                  style={{ marginTop: 12, width: '100%', padding: '8px', borderRadius: 6, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Next Step
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

const controlBtnStyle = {
  padding: '8px 12px',
  borderRadius: 8,
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: 600,
  transition: 'transform 0.1s'
};

const Workspace = ({ droppedItems, onDrop, isPouring, currentPH, activeExp, titrantVol, dnd }) => {
  const { useDrop } = dnd;
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.EQUIPMENT,
    drop: (item) => onDrop(item.type || ItemTypes.EQUIPMENT, item.name),
    collect: (m) => ({ isOver: !!m.isOver() })
  }));

  const indicatorColor = activeExp.colorMap(currentPH);

  return (
    <div
      ref={drop}
      style={{
        width: '100%',
        height: '100%',
        background: isOver ? '#f1f5f9' : 'transparent',
        position: 'relative',
        transition: 'background 0.2s'
      }}
    >
      {/* Burette Setup */}
      <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        {droppedItems['Burette'] ? (
          <div style={{ position: 'relative' }}>
            <BuretteSVG 
              level={droppedItems[activeExp.titrant] ? (50 - titrantVol) : 0} 
              reagent={droppedItems[activeExp.titrant]} 
            />
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>
              {droppedItems[activeExp.titrant] ? activeExp.titrant : 'Fill Burette'}
            </div>
            {isPouring && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 4,
                  height: 20,
                  background: 'rgba(173, 216, 230, 0.6)',
                  borderRadius: 2,
                  animation: 'pourAnim 0.5s infinite'
                }}
              />
            )}
          </div>
        ) : (
          <div style={{ width: 40, height: 180, border: '2px dashed #cbd5e1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.7rem' }}>
            Burette Zone
          </div>
        )}
      </div>

      {/* Flask Setup */}
      <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        {droppedItems['Conical Flask'] ? (
          <div>
            <FlaskSVG 
              volume={activeExp.analyteVolume + titrantVol} 
              color={indicatorColor} 
              hasReagent={droppedItems[activeExp.analyte]} 
            />
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>
              {droppedItems[activeExp.analyte] ? activeExp.analyte : 'Fill Flask'}
            </div>
          </div>
        ) : (
          <div style={{ width: 100, height: 100, border: '2px dashed #cbd5e1', borderRadius: '50% 50% 10% 10%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.7rem' }}>
            Flask Zone
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes pourAnim {
            0% { height: 0; opacity: 1; }
            100% { height: 40px; opacity: 0; transform: translateX(-50%) translateY(10px); }
          }
        `}
      </style>
    </div>
  );
};

const Equipment = ({ name, type = 'equipment', dnd }) => {
  const { useDrag } = dnd;
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EQUIPMENT,
    item: { name, type },
    collect: (m) => ({ isDragging: !!m.isDragging() })
  }));

  const getIcon = () => {
    if (type === 'reagent') return '🧪';
    if (type === 'indicator') return '💧';
    return name === 'Burette' ? '📏' : '🧪';
  };

  return (
    <div
      ref={drag}
      style={{
        padding: '10px 14px',
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.2s'
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>{getIcon()}</span>
      <span style={{ fontWeight: 500, color: '#475569' }}>{name}</span>
    </div>
  );
};

export default LabSimulation;
