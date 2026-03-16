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
    title: 'Standardization of HCl with NaOH (Class 12 CBSE/Kerala)',
    titrant: 'NaOH',
    analyte: 'HCl',
    indicator: 'Phenolphthalein',
    titrantNormality: 0.1,
    analyteVolume: 20,
    analyteEqWeight: 40,
    colorMap: (pH) => (pH > 8.2 ? 'rgba(255, 105, 180, 0.7)' : 'rgba(200, 230, 255, 0.4)'),
    endpointDesc: 'Colorless to Pink',
    stoichiometry: 1,
    isCalculation: true
  },
  NA2CO3_H2SO4: {
    id: 'na2co3_h2so4',
    title: 'Estimation of Na2CO3 using standard H2SO4 (Class 12 CBSE)',
    titrant: 'H2SO4',
    analyte: 'Na2CO3',
    indicator: 'Methyl Orange',
    titrantNormality: 0.05,
    analyteVolume: 20,
    analyteEqWeight: 53,
    colorMap: (pH) => (pH > 4.4 ? 'rgba(255, 215, 0, 0.7)' : 'rgba(255, 69, 0, 0.7)'),
    endpointDesc: 'Golden Yellow to Orange Red',
    stoichiometry: 1,
    isCalculation: true
  }
};

const LabSimulation = ({ role = 'student', externalExperiment, experimentId }) => {
  const [dnd, setDnd] = useState({ loading: true });
  const [activeExp, setActiveExp] = useState(EXPERIMENTS.NAOH_HCL);
  const [titrantVol, setTitrantVol] = useState(0);
  const [isPouring, setIsPouring] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [droppedItems, setDroppedItems] = useState({});
  const [observations, setObservations] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [labCalcState, setLabCalcState] = useState({ display: '0', formula: '' });
  const [calcTab, setCalcTab] = useState('titration');
  const [stoichA, setStoichA] = useState(1);
  const [stoichB, setStoichB] = useState(1);
  const [unknownVar, setUnknownVar] = useState('M1');

  const isTeacher = role === 'teacher' || role === 'admin';

  // Determine if we should show the non-titration external experiment view
  const isExternal = Boolean(externalExperiment);

  const [allExps, setAllExps] = useState([]);
  
  useEffect(() => {
    // Fetch all experiments to populate the dropdown
    import('../../apiClient').then(apiModule => {
      const api = apiModule.default;
      api.get('/experiments').then(res => {
        setAllExps(res.data || []);
      }).catch(err => console.error('Error fetching experiments for lab dropdown', err));
    });
  }, []);

  const handleLabCalc = (val) => {
    setLabCalcState(prev => {
      if (val === 'C') return { display: '0', formula: '' };
      if (val === '=') {
        try {
          // eslint-disable-next-line no-eval
          const result = eval(prev.formula).toString();
          return { display: result, formula: result };
        } catch {
          return { display: 'Error', formula: '' };
        }
      }
      const newFormula = prev.formula + val;
      const newDisplay = (prev.display === '0' || prev.display === 'Error') ? val : prev.display + val;
      return { display: newDisplay, formula: newFormula };
    });
  };

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

  const [genericDroppedItems, setGenericDroppedItems] = useState([]);
  const [genericPhase, setGenericPhase] = useState('setup');

  useEffect(() => {
    setGenericDroppedItems([]);
    setGenericPhase('setup');
  }, [experimentId]);

  useEffect(() => {
    if (isExternal && externalExperiment?.apparatus) {
      if (genericPhase === 'setup' && externalExperiment.apparatus.length > 0) {
        if (genericDroppedItems.length === externalExperiment.apparatus.length) {
          setGenericPhase('ready');
        }
      }
    }
  }, [genericDroppedItems, isExternal, externalExperiment, genericPhase]);

  const handleGenericDrop = (name) => {
    if (!genericDroppedItems.includes(name)) {
      setGenericDroppedItems(prev => [...prev, name]);
    }
  };

  const executeGenericAction = () => {
    setGenericPhase('running');
    setTimeout(() => {
      setGenericPhase('done');
    }, 1500);
  };

  const guides = [
    `Experiment: ${activeExp.title}. Rinse the burette with ${activeExp.titrant} and pipette with ${activeExp.analyte}.`,
    `Drag the Burette and Conical Flask to the workspace to set up your equipment.`,
    `Fill the Burette with ${activeExp.titrant} and the Conical Flask with ${activeExp.analyte} by dragging them from the inventory.`,
    `Add ${activeExp.indicator} indicator to the flask to observe the end point color change.`,
    `Titrate by adding ${activeExp.titrant} dropwise. Watch the color and pH until the end point (${activeExp.endpointDesc}).`,
    `Calculation Step 1: Identify your values. V1 = 20mL, M2 = ${activeExp.titrantNormality}M, V2 = ${titrantVol.toFixed(2)}mL, a = ${stoichA}, b = ${stoichB}.`,
    `Calculation Step 2: Use M1×V1×a = M2×V2×b. For M1: (${activeExp.titrantNormality} × ${titrantVol.toFixed(2)} × ${stoichB}) / (20 × ${stoichA}).`,
    `Final Step: Enter your calculated Molarity (M1) below to verify your experimental results.`
  ];

  const currentPH = useMemo(() => {
    const isTitratingAcid = activeExp.titrant === 'H2SO4' || activeExp.titrant === 'HCl';
    
    // Normalities
    const nTitrant = activeExp.titrant === 'H2SO4' ? 0.05 * 2 : 0.1;
    const nAnalyte = 0.1;

    const vTitrant = titrantVol;
    const vAnalyte = 20;

    const molesTitrant = vTitrant * nTitrant;
    const molesAnalyte = vAnalyte * nAnalyte;

    let ph;
    if (isTitratingAcid) {
      // Titrating base with acid
      if (molesTitrant < molesAnalyte) {
        // Excess base
        const remOH = (molesAnalyte - molesTitrant) / (vTitrant + vAnalyte);
        ph = 14 + Math.log10(Math.max(1e-14, remOH));
      } else {
        // Excess acid
        const remH = (molesTitrant - molesAnalyte) / (vTitrant + vAnalyte);
        ph = -Math.log10(Math.max(1e-14, remH));
      }
    } else {
      // Titrating acid with base
      if (molesTitrant < molesAnalyte) {
        // Excess acid
        const remH = (molesAnalyte - molesTitrant) / (vTitrant + vAnalyte);
        ph = -Math.log10(Math.max(1e-14, remH));
      } else {
        // Excess base
        const remOH = (molesTitrant - molesAnalyte) / (vTitrant + vAnalyte);
        ph = 14 + Math.log10(Math.max(1e-14, remOH));
      }
    }
    return ph;
  }, [titrantVol, activeExp]);

  const checkCalculation = () => {
    const inputVal = parseFloat(calcInput);
    const vTitrant = titrantVol;
    const mTitrant = activeExp.titrantNormality;
    const vAnalyte = 20;
    const expected = (mTitrant * vTitrant * stoichB) / (vAnalyte * stoichA);

    if (Math.abs(inputVal - expected) < 0.01) {
      setCalcResult({ success: true, val: expected.toFixed(4) });
    } else {
      setCalcResult({ success: false, expected: expected.toFixed(4) });
    }
  };

  const autoTitrate = () => {
    if (!isTeacher) return;
    setTitrantVol(20); // Perfect endpoint for 1:1 0.1M titration
    setDroppedItems(prev => ({ ...prev, [activeExp.titrant]: true, [activeExp.analyte]: true, [activeExp.indicator]: true, 'Burette': true, 'Conical Flask': true }));
    setGuideStep(4);
  };

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

  useEffect(() => {
    // Auto-advance titration step if endpoint reached
    if (guideStep === 4) {
      const reachedEndpoint = (activeExp.id === 'naoh_hcl' && currentPH > 8.2) || 
                              (activeExp.id === 'na2co3_h2so4' && currentPH < 4.4);
      if (reachedEndpoint && titrantVol > 0) {
        setGuideStep(5);
      }
    }
  }, [currentPH, guideStep, activeExp.id, titrantVol]);

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

  const renderDropdown = () => (
    <select 
      value={(isExternal ? experimentId : activeExp.id) || ''} 
      onChange={(e) => {
        const selectedId = e.target.value;
        const internalExp = Object.values(EXPERIMENTS).find(ex => ex.id === selectedId);
        if (internalExp) {
          if (isExternal) {
             window.location.href = '/experiments'; 
          } else {
             setActiveExp(internalExp);
             resetExperiment();
          }
        } else {
          window.location.href = `/experiments/${selectedId}`;
        }
      }}
      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', outline: 'none', maxWidth: 300, textOverflow: 'ellipsis' }}
    >
      <optgroup label="Interactive Titrations">
        {Object.values(EXPERIMENTS).map(exp => (
          <option key={exp.id} value={exp.id}>{exp.title}</option>
        ))}
      </optgroup>
      
      {Object.keys(allExps.reduce((acc, exp) => {
        const lvl = exp.classLevel || 'Other';
        if (!acc[lvl]) acc[lvl] = [];
        acc[lvl].push(exp);
        return acc;
      }, {})).sort((a,b) => (a === 'Other' ? 1 : b === 'Other' ? -1 : a - b)).map(lvl => (
        <optgroup key={lvl} label={lvl === 'Other' ? 'General Experiments' : `Class ${lvl} Experiments`}>
          {allExps.filter(e => (e.classLevel || 'Other').toString() === lvl).map(exp => (
            <option key={exp._id} value={exp._id}>{exp.title}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  if (dnd.loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Virtual Lab...</div>;
  if (dnd.error) return <div style={{ padding: 40, textAlign: 'center', color: '#d00' }}>Error loading drag-and-drop components.</div>;

  const { DndProvider, HTML5Backend } = dnd;

  if (isExternal) {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="dashboard-card" style={{ maxWidth: 1000, margin: '0 auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '2px solid #e2e8f0', paddingBottom: 12 }}>
            <h3 style={{ fontSize: '1.5rem', color: '#0f172a', margin: 0 }}>
              {externalExperiment.name}
            </h3>
            {renderDropdown()}
          </div>
          <p style={{ fontSize: '1.05rem', color: '#475569', marginBottom: 24 }}>
            {externalExperiment.description}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: 32 }}>
            {/* Sidebar Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {externalExperiment.apparatus?.length > 0 && (
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🔬</span> Apparatus Inventory
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                    {externalExperiment.apparatus.map((item, i) => (
                      <GenericEquipment 
                        key={i} 
                        name={item} 
                        dnd={dnd} 
                        isAdded={genericDroppedItems.includes(item)} 
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {externalExperiment.principles && (
                <div style={{ background: '#eff6ff', padding: 16, borderRadius: 8, border: '1px solid #bfdbfe' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>💡</span> Core Principles
                  </h4>
                  <div style={{ color: '#1e40af', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {externalExperiment.principles}
                  </div>
                </div>
              )}

              {externalExperiment.safetyPrecautions && (
                <div style={{ background: '#fef2f2', padding: 16, borderRadius: 8, border: '1px solid #fecaca' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>⚠️</span> Safety Precautions
                  </h4>
                  <div style={{ color: '#b91c1c', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {externalExperiment.safetyPrecautions}
                  </div>
                </div>
              )}
            </div>

            {/* Main Procedure Content */}
            <div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ background: '#f1f5f9', padding: '12px 16px', fontWeight: 600, color: '#334155', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Interactive Workspace
                  <button onClick={() => { setGenericDroppedItems([]); setGenericPhase('setup'); }} style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: 4, background: '#e2e8f0', border: 'none', cursor: 'pointer', color: '#475569' }}>Reset Desk</button>
                </div>
                <GenericWorkspace 
                  droppedItems={genericDroppedItems} 
                  onDrop={handleGenericDrop} 
                  phase={genericPhase} 
                  onAction={executeGenericAction} 
                  dnd={dnd} 
                />
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: '#f1f5f9', padding: '12px 16px', fontWeight: 600, color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
                  Experimental Procedure
                </div>
                <div style={{ padding: 20 }}>
                  {externalExperiment.steps?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {externalExperiment.steps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, opacity: genericPhase === 'done' ? 1 : 0.6 }}>
                          <div style={{ background: genericPhase === 'done' ? '#10b981' : '#cbd5e1', color: '#fff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, transition: 'background 0.3s' }}>
                            {genericPhase === 'done' ? '✓' : i + 1}
                          </div>
                          <div style={{ color: '#334155', lineHeight: 1.5, paddingTop: 3 }}>
                            {step}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No procedural steps provided.</p>
                  )}
                </div>
              </div>

              {externalExperiment.expectedResult && genericPhase === 'done' && (
                <div style={{ marginTop: 24, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 20, animation: 'fadeIn 0.5s' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>✅</span> Expected Result Observed
                  </h4>
                  <div style={{ color: '#15803d', fontSize: '1.05rem', lineHeight: 1.6 }}>
                    {externalExperiment.expectedResult}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DndProvider>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="dashboard-card" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>Virtual Lab Sandbox: {activeExp.title}</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            {isTeacher && (
              <button 
                onClick={autoTitrate}
                style={{ padding: '8px 16px', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Auto-Titrate
              </button>
            )}
            {renderDropdown()}
            {(!isExternal) && (
              <>
                <button 
                  onClick={() => setShowCalculator(s => !s)}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#0ea5e9', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  {showCalculator ? 'Hide Calculator' : 'Calculator'}
                </button>
                <button 
                  onClick={resetExperiment}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Reset Lab
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 20 }}>
          {/* Inventory */}
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#334155' }}>Inventory</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <Equipment name="Burette" dnd={dnd} isAdded={droppedItems['Burette']} />
              <Equipment name="Conical Flask" dnd={dnd} isAdded={droppedItems['Conical Flask']} />
              <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }} />
              <Equipment name={activeExp.titrant} type="reagent" dnd={dnd} isAdded={droppedItems[activeExp.titrant]} />
              <Equipment name={activeExp.analyte} type="reagent" dnd={dnd} isAdded={droppedItems[activeExp.analyte]} />
              <Equipment name={activeExp.indicator} type="indicator" dnd={dnd} isAdded={droppedItems[activeExp.indicator]} />
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
              <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 16px', background: 'rgba(255,255,255,0.98)', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 16px -4px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '280px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6366f1', marginBottom: 2, textAlign: 'center', letterSpacing: '0.5px' }}>TITRATION CONTROLS</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <button onClick={() => addTitrant(0.05)} style={{ ...controlBtnStyle, padding: '6px 10px', fontSize: '0.75rem' }}>Add Drop</button>
                  <button onClick={() => addTitrant(1.0)} style={{ ...controlBtnStyle, padding: '6px 10px', fontSize: '0.75rem' }}>Add 1.0 mL</button>
                  <button onClick={() => addTitrant(5.0)} style={{ ...controlBtnStyle, padding: '6px 10px', fontSize: '0.75rem' }}>Add 5.0 mL</button>
                </div>
                <button onClick={recordObservation} style={{ ...controlBtnStyle, background: '#10b981', width: '100%', padding: '8px', fontSize: '0.8rem', marginTop: 4 }}>Record Reading</button>
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
              
              {guideStep === guides.length - 1 && (
                <div style={{ marginTop: 12, padding: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
                  <input 
                    type="number" 
                    placeholder="Enter Molarity (M)" 
                    value={calcInput} 
                    onChange={(e) => setCalcInput(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: 'none', marginBottom: 8, outline: 'none' }}
                  />
                  <button 
                    onClick={checkCalculation}
                    style={{ width: '100%', padding: '8px', borderRadius: 6, background: '#fff', color: '#6366f1', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Verify Calculation
                  </button>
                  {calcResult && (
                    <div style={{ marginTop: 8, fontSize: '0.8rem', fontWeight: 600, color: calcResult.success ? '#10b981' : '#fee2e2' }}>
                      {calcResult.success ? `✓ Correct! Molarity = ${calcResult.val} M` : `❌ Incorrect. Hint: M1V1 = M2V2`}
                    </div>
                  )}
                </div>
              )}

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

        {showCalculator && (
          <div style={{ position: 'fixed', right: 24, top: 120, width: 360, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 20px 40px rgba(2,6,23,0.15)', zIndex: 1000 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>Quick Calculator</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href="/calculator" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', padding: '6px 8px', border: '1px solid #bfdbfe', borderRadius: 6, background: '#eff6ff' }}>Open Full</a>
                <button onClick={() => setShowCalculator(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Close</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, padding: 8, borderBottom: '1px solid #e2e8f0' }}>
              <button onClick={() => setCalcTab('titration')} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid ' + (calcTab === 'titration' ? '#6366f1' : '#e2e8f0'), background: calcTab === 'titration' ? '#eef2ff' : '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Titration
              </button>
              <button onClick={() => setCalcTab('basic')} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid ' + (calcTab === 'basic' ? '#6366f1' : '#e2e8f0'), background: calcTab === 'basic' ? '#eef2ff' : '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Basic
              </button>
            </div>
            {calcTab === 'titration' ? (
              <div style={{ padding: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>Unknown</div>
                    <select value={unknownVar} onChange={(e) => setUnknownVar(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <option value="M1">M1</option>
                      <option value="V1">V1</option>
                      <option value="M2">M2</option>
                      <option value="V2">V2</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>V1 (mL)</div>
                    <input type="number" value={activeExp.analyteVolume} readOnly={unknownVar!=='V1'} onChange={()=>{}} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', opacity: unknownVar==='V1'?1:0.8 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>M2</div>
                    <input type="number" value={activeExp.titrantNormality} readOnly={unknownVar!=='M2'} onChange={()=>{}} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', opacity: unknownVar==='M2'?1:0.8 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>V2 (mL)</div>
                    <input type="number" value={titrantVol.toFixed(2)} readOnly={unknownVar!=='V2'} onChange={()=>{}} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', opacity: unknownVar==='V2'?1:0.8 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>M1</div>
                    <input type="number" value={calcInput} readOnly={unknownVar!=='M1'} onChange={()=>{}} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', opacity: unknownVar==='M1'?1:0.8 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>a (analyte)</div>
                    <input type="number" value={stoichA} onChange={(e)=>setStoichA(parseFloat(e.target.value)||1)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>b (titrant)</div>
                    <input type="number" value={stoichB} onChange={(e)=>setStoichB(parseFloat(e.target.value)||1)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  </div>
                </div>
                <div style={{ marginTop: 10, padding: 10, background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#334155', marginBottom: 6 }}>M1×V1×a = M2×V2×b</div>
                  <DynamicTitrationResult 
                    unknown={unknownVar}
                    V1={activeExp.analyteVolume}
                    M2={activeExp.titrantNormality}
                    V2={parseFloat(titrantVol.toFixed(2))}
                    M1={parseFloat(calcInput || '0')}
                    a={stoichA}
                    b={stoichB}
                  />
                </div>
              </div>
            ) : (
              <div style={{ padding: 12 }}>
                <div style={{ background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8, fontWeight: 700, textAlign: 'right', fontSize: 22 }}>
                  {labCalcState.display}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 10 }}>
                  {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(k => (
                    <button key={k} onClick={() => handleLabCalc(k)} style={{ padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                      {k}
                    </button>
                  ))}
                  <button onClick={() => handleLabCalc('C')} style={{ gridColumn: 'span 4', padding: 10, borderRadius: 8, border: '1px solid #fecaca', background: '#fee2e2', cursor: 'pointer', fontWeight: 700 }}>
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DndProvider>
  );
};

const DynamicTitrationResult = ({ unknown, V1, M2, V2, M1, a, b }) => {
  let value = null;
  if (unknown === 'M1') {
    value = (M2 * V2 * b) / (V1 * a);
  } else if (unknown === 'V1') {
    value = (M2 * V2 * b) / (M1 * a || NaN);
  } else if (unknown === 'M2') {
    value = (M1 * V1 * a) / (V2 * b || NaN);
  } else if (unknown === 'V2') {
    value = (M1 * V1 * a) / (M2 * b || NaN);
  }
  const ok = Number.isFinite(value);
  const unit = unknown === 'V1' || unknown === 'V2' ? 'mL' : 'M';
  return (
    <div style={{ fontSize: 18, fontWeight: 800, color: '#0ea5e9' }}>
      {ok ? `${unknown} = ${value.toFixed(4)} ${unit}` : 'Enter known values'}
    </div>
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

const getEquipmentSVG = (name, phase) => {
  const isDone = phase === 'done';
  const isRunning = phase === 'running';
  const lowerName = name.toLowerCase();
  
  // Burner
  if (lowerName.includes('burner') || lowerName.includes('heat')) {
    return (
      <svg width="60" height="80" viewBox="0 0 60 80">
        <path d="M20 60 L40 60 L45 75 L15 75 Z" fill="#64748b" />
        <rect x="25" y="45" width="10" height="15" fill="#94a3b8" />
        {(isRunning || isDone) && (
          <path d="M30 40 Q20 30 30 10 Q40 30 30 40" fill="#ef4444" stroke="#f59e0b" strokeWidth="2" opacity={isRunning ? "0.9" : "0.5"} style={{animation: 'flicker 0.2s infinite alternate'}} />
        )}
      </svg>
    );
  }
  
  // Test tube
  if (lowerName.includes('test tube') || lowerName.includes('test-tube')) {
    return (
      <svg width="30" height="80" viewBox="0 0 30 80">
        <path d="M5 10 L5 65 A10 10 0 0 0 25 65 L25 10" fill="none" stroke="#cbd5e1" strokeWidth="2" />
        <ellipse cx="15" cy="10" rx="10" ry="3" fill="none" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M6 45 L6 65 A9 9 0 0 0 24 65 L24 45 Z" fill={isDone ? (lowerName.includes('iron') ? "rgba(180, 80, 20, 0.6)" : "rgba(16, 185, 129, 0.5)") : "rgba(148, 163, 184, 0.2)"} />
        {isRunning && <circle cx="15" cy="60" r="2" fill="#fff" style={{animation: 'bubbleUp 1s infinite linear'}} />}
      </svg>
    );
  }
  
  // Beaker
  if (lowerName.includes('beaker')) {
    return (
      <svg width="70" height="80" viewBox="0 0 70 80">
        <path d="M10 15 L15 75 A5 5 0 0 0 20 80 L50 80 A5 5 0 0 0 55 75 L60 15 M5 15 L15 15 M55 15 L65 15" fill="none" stroke="#cbd5e1" strokeWidth="2" />
        <path d="M13 40 L16 76 A4 4 0 0 0 20 78 L50 78 A4 4 0 0 0 54 76 L57 40 Z" fill={isDone ? "rgba(59, 130, 246, 0.5)" : "rgba(148, 163, 184, 0.1)"} />
        {[...Array(5)].map((_, i) => <line key={i} x1="20" y1={30 + i*10} x2="25" y2={30 + i*10} stroke="#cbd5e1" strokeWidth="1" />)}
      </svg>
    );
  }
  
  // Conical / Flask
  if (lowerName.includes('flask')) {
    return (
      <svg width="60" height="80" viewBox="0 0 60 80">
        <path d="M25 15 L35 15 L35 35 L50 75 A5 5 0 0 1 45 80 L15 80 A5 5 0 0 1 10 75 L25 35 Z" fill="none" stroke="#cbd5e1" strokeWidth="2" />
        <path d="M18 55 L42 55 L48 76 A3 3 0 0 1 45 78 L15 78 A3 3 0 0 1 12 76 Z" fill={isDone ? "rgba(236, 72, 153, 0.5)" : "rgba(148, 163, 184, 0.1)"} />
      </svg>
    );
  }
  
  // Solid metals / Iron nail / Paper / Generic Solid
  if (lowerName.includes('iron') || lowerName.includes('nail') || lowerName.includes('paper') || lowerName.includes('solid')) {
    return (
      <svg width="40" height="40" viewBox="0 0 40 40">
        <rect x="5" y="15" width="30" height="10" rx="2" fill={isDone && lowerName.includes('iron') ? "#c2410c" : (lowerName.includes('paper') ? "#f8fafc" : "#94a3b8")} stroke="#475569" strokeWidth="1" />
        {isDone && lowerName.includes('burn') && <path d="M10 10 Q20 0 30 10" stroke="#ef4444" fill="none" strokeWidth="2" />}
      </svg>
    );
  }
  
  
  // Default Generic Box
  return (
    <svg width="50" height="80" viewBox="0 0 50 80">
      <rect x="5" y="40" width="40" height="30" rx="4" fill={isDone ? "#60a5fa" : "#f1f5f9"} stroke="#cbd5e1" strokeWidth="2" />
      <text x="25" y="58" fontSize="10" textAnchor="middle" fill={isDone ? "#fff" : "#64748b"} fontWeight="bold">ITEM</text>
    </svg>
  );
};

const GenericEquipment = ({ name, dnd, isAdded }) => {
  const { useDrag } = dnd;
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'GENERIC_EQUIPMENT',
    item: { name },
    collect: (m) => ({ isDragging: !!m.isDragging() })
  }));

  return (
    <div
      ref={drag}
      style={{
        padding: '10px 14px',
        background: isAdded ? '#f8fafc' : '#fff',
        border: isAdded ? '1px solid #10b981' : '1px solid #e2e8f0',
        borderRadius: 8,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: isAdded ? '0 0 0 1px rgba(16, 185, 129, 0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>📦</span>
        <span style={{ fontWeight: 500, color: isAdded ? '#10b981' : '#475569' }}>{name}</span>
      </div>
      {isAdded && <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>}
    </div>
  );
};

const GenericWorkspace = ({ droppedItems, onDrop, phase, onAction, dnd }) => {
  const { useDrop } = dnd;
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'GENERIC_EQUIPMENT',
    drop: (item) => onDrop(item.name),
    collect: (m) => ({ isOver: !!m.isOver() })
  }));

  return (
    <div
      ref={drop}
      style={{
        width: '100%',
        minHeight: 350,
        background: isOver ? '#e2e8f0' : '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'background 0.2s',
        overflow: 'hidden',
        borderBottom: '20px solid #cbd5e1', // The "table edge"
        boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.05)'
      }}
    >
      {/* 3D Bench Perspective background */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to bottom, #f1f5f9 0%, #e2e8f0 100%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60%', background: '#fff', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '40%', left: 0, right: 0, height: '1px', background: '#cbd5e1', zIndex: 0 }} /> {/* Horizon line */}

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
        {droppedItems.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: '1.05rem', textAlign: 'center', background: 'rgba(255,255,255,0.8)', padding: '20px 40px', borderRadius: 12, border: '2px dashed #cbd5e1' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🧪</div>
            <strong>Virtual Laboratory Bench</strong><br/>
            Drag apparatus from the left inventory onto the bench to assemble your experiment setup.
          </div>
        )}

        {/* Dropped Equipment Display */}
        {droppedItems.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 24, height: 150, marginBottom: 40, width: '100%', zIndex: 10 }}>
            {droppedItems.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation: 'dropIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  position: 'relative'
                }}
              >
                {/* SVG Graphic */}
                <div style={{ filter: 'drop-shadow(0 10px 8px rgba(0,0,0,0.1))' }}>
                  {getEquipmentSVG(item, phase)}
                </div>
                {/* Label Tab */}
                <div style={{ 
                  marginTop: 12, 
                  fontSize: '0.75rem', 
                  background: '#334155', 
                  color: '#fff', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontWeight: 600,
                  opacity: 0.8
                }}>
                  {item}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {phase === 'ready' && (
            <button
              onClick={onAction}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 50,
                fontSize: '1.1rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.5), inset 0 2px 0 rgba(255,255,255,0.2)',
                animation: 'pulseBtn 2s infinite',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Start Experiment
            </button>
          )}

          {phase === 'running' && (
            <div style={{ 
              color: '#3730a3', 
              fontSize: '1.2rem', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              background: '#e0e7ff',
              padding: '10px 24px',
              borderRadius: 50,
              boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)'
            }}>
              <span style={{ display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>⚙️</span> 
              Simulating Reaction...
            </div>
          )}

          {phase === 'done' && (
            <div
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                borderRadius: 50,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                animation: 'successPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4), inset 0 2px 0 rgba(255,255,255,0.2)'
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>✨</span> Experiment Completed
            </div>
          )}
        </div>
      </div>

      {phase === 'done' && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 20 }}>
           <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(255,255,255,0) 60%)', animation: 'expand 1.5s forwards ease-out' }} />
        </div>
      )}

      <style>
        {`
          @keyframes dropIn { 0% { transform: translateY(-30px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
          @keyframes pulseBtn { 0% { transform: scale(1); box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.5); } 50% { transform: scale(1.03); box-shadow: 0 15px 35px -5px rgba(245, 158, 11, 0.7); } 100% { transform: scale(1); box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.5); } }
          @keyframes successPop { 0% { transform: scale(0.8) translateY(20px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes expand { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0); } 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
          @keyframes flicker { 0% { opacity: 0.8; transform: scaleY(1); } 100% { opacity: 1; transform: scaleY(1.1); } }
          @keyframes bubbleUp { 0% { transform: translateY(0); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(-30px); opacity: 0; } }
        `}
      </style>
    </div>
  );
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
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
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
      <div style={{ position: 'absolute', bottom: 240, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10 }}>
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

const Equipment = ({ name, type = 'equipment', dnd, isAdded }) => {
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
        background: isAdded ? '#f1f5f9' : '#fff',
        border: isAdded ? '1px solid #6366f1' : '1px solid #e2e8f0',
        borderRadius: 8,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: isAdded ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.2s',
        position: 'relative'
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>{getIcon()}</span>
      <span style={{ fontWeight: 500, color: isAdded ? '#6366f1' : '#475569' }}>{name}</span>
      {isAdded && (
        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#10b981' }}>✓</span>
      )}
    </div>
  );
};

export default LabSimulation;
