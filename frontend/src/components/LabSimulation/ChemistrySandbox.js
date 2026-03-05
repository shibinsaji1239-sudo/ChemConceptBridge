import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EXPERIMENTS } from './experiments';

const ItemTypes = {
  VESSEL: 'vessel',
  CHEMICAL: 'chemical',
  TOOL: 'tool'
};

const INITIAL_VESSELS = [
  { id: 'beaker', name: 'Beaker', type: 'vessel', capacity: 250, shape: 'beaker' },
  { id: 'flask', name: 'Conical Flask', type: 'vessel', capacity: 250, shape: 'flask' },
  { id: 'test_tube', name: 'Test Tube', type: 'vessel', capacity: 50, shape: 'tube' }
];

const INITIAL_CHEMICALS = [
  { id: 'h2o', name: 'Distilled Water', type: 'chemical', color: '#38bdf8', ph: 7, molarity: 55.5 },
  { id: 'hcl', name: 'HCl (Hydrochloric Acid)', type: 'chemical', color: '#e2e8f0', ph: 1, molarity: 0.1 },
  { id: 'naoh', name: 'NaOH (Sodium Hydroxide)', type: 'chemical', color: '#f1f5f9', ph: 14, molarity: 0.1 },
  { id: 'kmno4', name: 'Potassium Permanganate', type: 'chemical', color: '#701a75', ph: 7, molarity: 0.02 },
  { id: 'phth', name: 'Phenolphthalein Indicator', type: 'chemical', color: 'transparent', ph: 7, isIndicator: true },
  { id: 'agno3', name: 'Silver Nitrate (AgNO₃)', type: 'chemical', color: '#f8fafc', ph: 6, molarity: 0.1 },
  { id: 'nacl', name: 'Sodium Chloride (NaCl)', type: 'chemical', color: '#f1f5f9', ph: 7, molarity: 0.1 }
];

const INITIAL_TOOLS = [
  { id: 'burner', name: 'Bunsen Burner', type: 'tool', isHeatSource: true },
  { id: 'burette', name: 'Burette (50mL)', type: 'tool', capacity: 50 },
  { id: 'stirrer', name: 'Glass Rod', type: 'tool' },
  { id: 'thermometer', name: 'Thermometer', type: 'tool' }
];

const BuretteSVG = ({ isSelected, fillLevel, color, isDispensing }) => {
  const strokeColor = isSelected ? '#6366f1' : '#cbd5e1';
  return (
    <svg viewBox="0 0 60 200" width="100%" height="100%">
      {/* Stand */}
      <rect x="5" y="10" width="4" height="180" fill="#475569" />
      <rect x="0" y="180" width="30" height="5" rx="2" fill="#334155" />
      <rect x="5" y="40" width="20" height="4" fill="#475569" />
      
      {/* Burette Tube */}
      <rect x="22" y="10" width="12" height="150" fill="none" stroke={strokeColor} strokeWidth="2" />
      {fillLevel > 0 && (
        <rect x="23" y={160 - (fillLevel / 50) * 150} width="10" height={(fillLevel / 50) * 150} fill={color} opacity="0.6" />
      )}
      
      {/* Graduations */}
      {[0, 10, 20, 30, 40, 50].map(v => (
        <line key={v} x1="22" y1={10 + (v / 50) * 150} x2="28" y2={10 + (v / 50) * 150} stroke="#475569" strokeWidth="0.5" />
      ))}
      
      {/* Stopcock */}
      <circle cx="28" cy="165" r="5" fill="#1e293b" stroke={strokeColor} strokeWidth="1" />
      <rect x="24" y="163" width="8" height="4" rx="1" fill={isDispensing ? '#22c55e' : '#94a3b8'} transform={isDispensing ? 'rotate(90 28 165)' : ''} />
      
      {/* Tip */}
      <path d="M26 170 L30 170 L28 185 Z" fill="#94a3b8" />
      
      {/* Drip animation */}
      {isDispensing && (
        <circle cx="28" cy="190" r="2" fill={color}>
          <animate attributeName="cy" from="190" to="210" dur="0.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0" dur="0.6s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
};

const VesselSVG = ({ shape, isSelected, fillLevel, color, precipitate, temp }) => {
  const strokeColor = isSelected ? '#6366f1' : '#cbd5e1';
  const renderLiquid = (w, h, x, y, r = 8) => (
    <>
      <path d={`M${x} ${y + h - fillLevel} L${x + w} ${y + h - fillLevel} L${x + w} ${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} L${x + r} ${y + h} A${r} ${r} 0 0 1 ${x} ${y + h - r} Z`} fill={color} opacity="0.6" />
      {precipitate && <path d={`M${x + 5} ${y + h - 5} L${x + w - 5} ${y + h - 5} L${x + w - 8} ${y + h} L${x + 8} ${y + h} Z`} fill="#fff" opacity="0.9" />}
      {temp > 95 && <circle cx={x + w / 2} cy={y + h - fillLevel + 5} r="2" fill="white" opacity="0.5"><animate attributeName="cy" from={y + h - fillLevel + 5} to={y + h - fillLevel - 10} dur="1s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.5;0" dur="1s" repeatCount="indefinite" /></circle>}
    </>
  );

  return (
    <svg viewBox="0 0 100 120" width="100%" height="100%">
      {shape === 'beaker' && (
        <>
          <path d="M20 10 L20 110 A10 10 0 0 0 30 120 L70 120 A10 10 0 0 0 80 110 L80 10" fill="none" stroke={strokeColor} strokeWidth="3" />
          {fillLevel > 0 && renderLiquid(56, 108, 22, 10, 8)}
          {[20, 40, 60, 80, 100].map(v => <line key={v} x1="20" y1={120 - v} x2="30" y2={120 - v} stroke="#475569" strokeWidth="1" />)}
        </>
      )}
      {shape === 'flask' && (
        <>
          <path d="M40 10 L40 40 L15 110 A10 10 0 0 0 25 120 L75 120 A10 10 0 0 0 85 110 L60 40 L60 10 Z" fill="none" stroke={strokeColor} strokeWidth="3" />
          {fillLevel > 0 && <path d={`M${40 - (fillLevel / 100) * 25} ${120 - fillLevel} L${60 + (fillLevel / 100) * 25} ${120 - fillLevel} L80 115 A5 5 0 0 1 75 118 L25 118 A5 5 0 0 1 20 115 Z`} fill={color} opacity="0.6" />}
        </>
      )}
      {shape === 'tube' && (
        <>
          <path d="M40 10 L40 110 A10 10 0 0 0 50 120 A10 10 0 0 0 60 110 L60 10" fill="none" stroke={strokeColor} strokeWidth="3" />
          {fillLevel > 0 && <path d={`M42 ${118 - fillLevel} L58 ${118 - fillLevel} L58 110 A8 8 0 0 1 50 118 A8 8 0 0 1 42 110 Z`} fill={color} opacity="0.6" />}
        </>
      )}
    </svg>
  );
};

const DraggableItem = ({ item, useDrag }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: item.type,
    item: { ...item },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() })
  }));
  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab', padding: '10px', border: '1px solid #334155', borderRadius: '8px', background: '#1e293b', color: '#f8fafc', marginBottom: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color || '#94a3b8' }} />
      {item.name}
    </div>
  );
};

const SandboxBench = ({ useDrag, useDrop }) => {
  const [activeItems, setActiveItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('vessels');
  const [currentExp, setCurrentExp] = useState(null);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [addingVolume, setAddingVolume] = useState(10);
  const canvasRef = useRef(null);

  const [{ isOverCanvas }, dropCanvas] = useDrop(() => ({
    accept: [ItemTypes.VESSEL, ItemTypes.TOOL],
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset || !canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = offset.x - canvasRect.left - 50;
      const y = offset.y - canvasRect.top - 60;

      if (item.instanceId) {
        // Move existing item
        updateItem(item.instanceId, { x, y });
      } else {
        // Create new item
        const newItem = { 
          ...item, 
          instanceId: Date.now(), 
          x, 
          y, 
          contents: (item.type === ItemTypes.VESSEL || item.id === 'burette') ? [] : undefined, 
          temp: item.type === ItemTypes.VESSEL ? 25 : undefined, 
          isActive: (item.id === 'burner' || item.id === 'burette') ? false : undefined 
        };
        setActiveItems(prev => [...prev, newItem]);
        setSelectedId(newItem.instanceId);
      }
    },
    collect: (monitor) => ({ isOverCanvas: !!monitor.isOver() })
  }));

  const [{ isOverVessel }, dropOnVessel] = useDrop(() => ({
    accept: ItemTypes.CHEMICAL,
    drop: (item, monitor) => {
      // Logic handled in VesselOnCanvas via the same hook pattern or passed down
    }
  }));

  const updateItem = (id, updates) => setActiveItems(prev => prev.map(v => v.instanceId === id ? { ...v, ...updates } : v));

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveItems(prev => {
        const burners = prev.filter(i => i.id === 'burner' && i.isActive);
        const activeBurettes = prev.filter(i => i.id === 'burette' && i.isActive && i.contents?.length > 0);
        
        let newItems = [...prev];

        // Handle Heating
        newItems = newItems.map(item => {
          if (item.type !== ItemTypes.VESSEL) return item;
          let newTemp = item.temp;
          let beingHeated = false;
          burners.forEach(burner => {
            const dx = item.x - burner.x;
            const dy = item.y - burner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) { newTemp += 0.8; beingHeated = true; }
          });
          if (!beingHeated && newTemp > 25) newTemp -= 0.15;
          return { ...item, temp: Math.min(100, Math.max(25, newTemp)) };
        });

        // Handle Burette Dispensing
        activeBurettes.forEach(burette => {
          // Find vessel below burette
          const vesselBelow = newItems.find(v => 
            v.type === ItemTypes.VESSEL && 
            Math.abs(v.x - (burette.x - 10)) < 60 && // Align horizontally
            (v.y - burette.y) > 100 && (v.y - burette.y) < 200 // Vessel is below tip
          );

          if (vesselBelow && burette.contents.length > 0) {
            const dispenseRate = 0.5; // mL per tick
            const chemical = burette.contents[0];
            const actualDispense = Math.min(dispenseRate, chemical.volume);

            if (actualDispense > 0) {
              // Remove from burette
              newItems = newItems.map(i => i.instanceId === burette.instanceId ? {
                ...i,
                contents: i.contents.map(c => ({ ...c, volume: c.volume - actualDispense })).filter(c => c.volume > 0.01),
                isActive: i.contents[0].volume <= actualDispense ? false : i.isActive
              } : i);

              // Add to vessel
              newItems = newItems.map(i => i.instanceId === vesselBelow.instanceId ? {
                ...i,
                contents: [...(i.contents || []), { ...chemical, volume: actualDispense, addedAt: Date.now() }]
              } : i);
            }
          }
        });

        return newItems;
      });
    }, 200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentExp) {
      const phase = currentExp.phases[currentPhaseIdx];
      if (phase.validation(activeItems)) {
        if (currentPhaseIdx < currentExp.phases.length - 1) {
          setCurrentPhaseIdx(prev => prev + 1);
        }
      }
    }
  }, [activeItems, currentExp, currentPhaseIdx]);

  const selectedItem = activeItems.find(i => i.instanceId === selectedId);

  const VesselOnCanvas = ({ vessel }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.VESSEL,
      item: { ...vessel },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() })
    }));

    const [{ isOver }, drop] = useDrop(() => ({
      accept: [ItemTypes.CHEMICAL],
      drop: (item) => {
        const vol = parseFloat(addingVolume);
        updateItem(vessel.instanceId, { 
          contents: [...(vessel.contents || []), { ...item, volume: vol, addedAt: Date.now() }] 
        });
      },
      collect: (monitor) => ({ isOver: !!monitor.isOver() })
    }));

    const mixData = useMemo(() => {
      if (!vessel.contents || vessel.contents.length === 0) return { color: 'transparent', ph: 7, totalVol: 0, precipitate: false };
      const totalVol = vessel.contents.reduce((acc, c) => acc + c.volume, 0);
      const avgPH = vessel.contents.reduce((acc, c) => acc + c.ph * c.volume, 0) / totalVol;
      const hasPhth = vessel.contents.some(c => c.id === 'phth');
      const hasAgNO3 = vessel.contents.some(c => c.id === 'agno3');
      const hasNaCl = vessel.contents.some(c => c.id === 'nacl');
      
      let color = vessel.contents[vessel.contents.length - 1].color;
      if (hasPhth && avgPH > 8.2) color = '#ff69b4';
      if (hasPhth && avgPH <= 8.2) color = 'rgba(255, 255, 255, 0.3)'; // Slightly cloudy but clear
      if (hasAgNO3 && hasNaCl) color = 'rgba(255, 255, 255, 0.9)'; // White milky precipitate
      
      return { color, ph: avgPH, totalVol, precipitate: hasAgNO3 && hasNaCl, avgPH };
    }, [vessel.contents]);

    return (
      <div 
        ref={(node) => drag(drop(node))} 
        onClick={() => setSelectedId(vessel.instanceId)} 
        style={{ 
          position: 'absolute', 
          left: vessel.x, 
          top: vessel.y, 
          width: 120, 
          height: 140, 
          cursor: 'grab', 
          opacity: isDragging ? 0.5 : 1,
          border: selectedId === vessel.instanceId ? '2px solid #6366f1' : '1px solid transparent', 
          borderRadius: '12px', 
          background: isOver ? 'rgba(99, 102, 241, 0.1)' : 'transparent', 
          transition: 'all 0.2s', 
          zIndex: selectedId === vessel.instanceId ? 10 : 1 
        }}
      >
        <VesselSVG shape={vessel.shape} isSelected={selectedId === vessel.instanceId} fillLevel={Math.min(100, (mixData.totalVol / vessel.capacity) * 100)} color={mixData.color} precipitate={mixData.precipitate} temp={vessel.temp} />
        <div style={{ position: 'absolute', bottom: -30, left: 0, width: '100%', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          {vessel.name}
          <div style={{ fontSize: '0.65rem', fontWeight: 400, color: '#94a3b8' }}>{mixData.totalVol.toFixed(1)}mL | pH {mixData.avgPH ? mixData.avgPH.toFixed(1) : '7.0'}</div>
        </div>
      </div>
    );
  };

  const ToolOnCanvas = ({ tool }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.TOOL,
      item: { ...tool },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() })
    }));

    const [{ isOver }, drop] = useDrop(() => ({
      accept: [ItemTypes.CHEMICAL],
      drop: (item) => {
        if (tool.id === 'burette') {
          const vol = parseFloat(addingVolume);
          updateItem(tool.instanceId, { 
            contents: [...(tool.contents || []), { ...item, volume: vol, addedAt: Date.now() }] 
          });
        }
      },
      collect: (monitor) => ({ isOver: !!monitor.isOver() })
    }));

    const totalVol = tool.contents?.reduce((acc, c) => acc + c.volume, 0) || 0;
    const mainColor = tool.contents?.[0]?.color || 'transparent';

    return (
      <div 
        ref={(node) => drag(drop(node))}
        onClick={() => setSelectedId(tool.instanceId)} 
        style={{ 
          position: 'absolute', 
          left: tool.x, 
          top: tool.y, 
          width: tool.id === 'burette' ? 80 : 100, 
          height: tool.id === 'burette' ? 220 : 120, 
          cursor: 'grab', 
          opacity: isDragging ? 0.5 : 1,
          border: selectedId === tool.instanceId ? '2px solid #6366f1' : '1px solid transparent', 
          borderRadius: '12px', 
          textAlign: 'center',
          background: isOver ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
          zIndex: selectedId === tool.instanceId ? 10 : 1
        }}
      >
        {tool.id === 'burner' && (
          <svg viewBox="0 0 100 120" width="100%" height="100%">
            <rect x="45" y="40" width="10" height="60" fill="#94a3b8" />
            <rect x="30" y="100" width="40" height="10" rx="5" fill="#475569" />
            <path d="M40 40 L60 40 L55 35 L45 35 Z" fill="#64748b" />
            {tool.isActive && <path d="M45 35 Q50 10 55 35 Z" fill="#f59e0b" opacity="0.8"><animate attributeName="d" values="M45 35 Q50 10 55 35 Z;M45 35 Q50 5 55 35 Z;M45 35 Q50 10 55 35 Z" dur="0.5s" repeatCount="indefinite" /></path>}
          </svg>
        )}
        {tool.id === 'burette' && (
          <BuretteSVG 
            isSelected={selectedId === tool.instanceId} 
            fillLevel={totalVol} 
            color={mainColor} 
            isDispensing={tool.isActive} 
          />
        )}
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', position: 'absolute', width: '100%', bottom: tool.id === 'burette' ? -20 : 0 }}>{tool.name}</div>
        
        <div style={{ marginTop: '4px' }}>
          {tool.id === 'burner' && (
            <button 
              onClick={(e) => { e.stopPropagation(); updateItem(tool.instanceId, { isActive: !tool.isActive }); }} 
              style={{ fontSize: '0.6rem', padding: '2px 4px', background: tool.isActive ? '#ef4444' : '#22c55e', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              {tool.isActive ? 'OFF' : 'IGNITE'}
            </button>
          )}
          {tool.id === 'burette' && (
            <button 
              onClick={(e) => { e.stopPropagation(); updateItem(tool.instanceId, { isActive: !tool.isActive }); }} 
              disabled={totalVol <= 0}
              style={{ fontSize: '0.6rem', padding: '2px 4px', background: tool.isActive ? '#ef4444' : '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: totalVol <= 0 ? 'not-allowed' : 'pointer', opacity: totalVol <= 0 ? 0.5 : 1 }}
            >
              {tool.isActive ? 'STOP' : 'OPEN TAP'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '800px', background: '#0f172a', borderRadius: '16px', overflow: 'hidden', border: '1px solid #1e293b' }}>
      {/* Teacher Inventory */}
      <div style={{ width: '260px', background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', background: '#0f172a', borderBottom: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 12px', color: '#6366f1', fontSize: '0.85rem', letterSpacing: '1px' }}>LAB PROTOCOL</h3>
          <select onChange={(e) => { const exp = EXPERIMENTS.find(ex => ex.id === e.target.value); setCurrentExp(exp); setCurrentPhaseIdx(0); setActiveItems([]); }} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1e293b', color: '#f8fafc', border: '1px solid #475569', fontSize: '0.85rem' }}>
            <option value="">Sandbox Mode</option>
            {EXPERIMENTS.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
          </select>
        </div>
        
        <div style={{ padding: '16px', borderBottom: '1px solid #334155', background: '#1e293b' }}>
          <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: '8px' }}>ADD QUANTITY (mL)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[5, 10, 25, 50].map(v => (
              <button key={v} onClick={() => setAddingVolume(v)} style={{ flex: 1, padding: '6px 0', borderRadius: '4px', background: addingVolume === v ? '#6366f1' : '#334155', color: '#fff', border: 'none', fontSize: '0.75rem', cursor: 'pointer' }}>{v}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #334155' }}>
          {['vessels', 'chemicals', 'tools'].map(tab => (
            <button key={tab} onClick={() => setSidebarTab(tab)} style={{ flex: 1, padding: '12px 0', background: sidebarTab === tab ? '#334155' : 'transparent', border: 'none', color: sidebarTab === tab ? '#f8fafc' : '#94a3b8', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>{tab}</button>
          ))}
        </div>
        <div style={{ padding: '12px', overflowY: 'auto', flex: 1 }}>
          {sidebarTab === 'vessels' && INITIAL_VESSELS.map(v => <DraggableItem key={v.id} item={v} useDrag={useDrag} />)}
          {sidebarTab === 'chemicals' && INITIAL_CHEMICALS.map(c => <DraggableItem key={c.id} item={c} useDrag={useDrag} />)}
          {sidebarTab === 'tools' && INITIAL_TOOLS.map(t => <DraggableItem key={t.id} item={t} useDrag={useDrag} />)}
        </div>
      </div>
      
      {/* Workbench Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {currentExp && (
          <div style={{ padding: '20px', background: '#1e293b', borderBottom: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 800, marginBottom: '4px' }}>PHASE {currentPhaseIdx + 1} OF {currentExp.phases.length}</div>
            <div style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600 }}>{currentExp.phases[currentPhaseIdx].instructions}</div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
              {currentExp.phases.map((_, i) => (
                <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < currentPhaseIdx ? '#22c55e' : i === currentPhaseIdx ? '#6366f1' : '#334155' }} />
              ))}
            </div>
          </div>
        )}
        <div id="sandbox-canvas" ref={(el) => { canvasRef.current = el; dropCanvas(el); }} style={{ flex: 1, position: 'relative', background: isOverCanvas ? '#1e293b' : '#0f172a', backgroundImage: 'radial-gradient(#1e293b 1.5px, transparent 1.5px)', backgroundSize: '40px 40px', overflow: 'hidden' }}>
          {activeItems.map(item => item.type === ItemTypes.VESSEL ? <VesselOnCanvas key={item.instanceId} vessel={item} /> : <ToolOnCanvas key={item.instanceId} tool={item} />)}
          {!activeItems.length && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', opacity: 0.3 }}>
              <div style={{ fontSize: '5rem' }}>⚗️</div>
              <p style={{ color: '#fff', fontSize: '1.2rem' }}>Bench Empty - Deploy Equipment</p>
            </div>
          )}
        </div>
      </div>

      {/* Observation & Results */}
      <div style={{ width: '320px', background: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', background: '#0f172a', borderBottom: '1px solid #334155' }}>
          <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.9rem', letterSpacing: '1px' }}>OBSERVATION LOG</h4>
        </div>
        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
          {selectedItem ? (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <div style={{ padding: '12px', background: '#0f172a', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>SELECTED OBJECT</div>
                <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1.2rem' }}>{selectedItem.name}</div>
              </div>

              {selectedItem.type === ItemTypes.VESSEL && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.6rem' }}>TEMP (°C)</div>
                      <div style={{ color: selectedItem.temp > 50 ? '#ef4444' : '#6366f1', fontSize: '1.4rem', fontWeight: 800 }}>{selectedItem.temp.toFixed(1)}°</div>
                    </div>
                    <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.6rem' }}>pH LEVEL</div>
                      <div style={{ color: '#22c55e', fontSize: '1.4rem', fontWeight: 800 }}>
                        {selectedItem.contents.length > 0 ? (selectedItem.contents.reduce((acc, c) => acc + c.ph * c.volume, 0) / selectedItem.contents.reduce((acc, c) => acc + c.volume, 0)).toFixed(1) : '7.0'}
                      </div>
                    </div>
                  </div>

                  <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: '10px' }}>CHEMICAL QUANTITIES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedItem.contents.length > 0 ? selectedItem.contents.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0f172a', padding: '10px', borderRadius: '6px', borderLeft: `4px solid ${c.color}` }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#f8fafc', fontSize: '0.8rem', fontWeight: 600 }}>{c.name}</div>
                          <div style={{ color: '#64748b', fontSize: '0.65rem' }}>{c.molarity} M Concentration</div>
                        </div>
                        <div style={{ color: '#f8fafc', fontSize: '0.85rem', fontWeight: 700 }}>{c.volume} mL</div>
                      </div>
                    )) : <div style={{ textAlign: 'center', padding: '20px', color: '#475569', fontSize: '0.8rem', border: '1px dashed #334155', borderRadius: '8px' }}>No Reagents Added</div>}
                  </div>
                </>
              )}
              <button onClick={() => { setActiveItems(prev => prev.filter(v => v.instanceId !== selectedId)); setSelectedId(null); }} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer', marginTop: '32px', fontSize: '0.8rem', fontWeight: 700 }}>DISPOSE EQUIPMENT</button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#475569', marginTop: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👁️</div>
              <p style={{ fontSize: '0.85rem' }}>Select an object on the workbench to begin detailed measurements.</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

const ChemistrySandbox = () => {
  const [dnd, setDnd] = useState({ loading: true });
  useEffect(() => {
    let mounted = true;
    Promise.all([import('react-dnd'), import('react-dnd-html5-backend')])
      .then(([dndLib, backendLib]) => {
        if (!mounted) return;
        setDnd({ loading: false, DndProvider: dndLib.DndProvider, useDrag: dndLib.useDrag, useDrop: dndLib.useDrop, HTML5Backend: backendLib.HTML5Backend });
      })
      .catch(() => { if (mounted) setDnd({ loading: false, error: true }); });
    return () => { mounted = false; };
  }, []);

  if (dnd.loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>Initializing High-Precision Lab...</div>;
  if (dnd.error || !dnd.DndProvider) return <div className="dashboard-card">Error loading sandbox engine</div>;

  return (
    <dnd.DndProvider backend={dnd.HTML5Backend}>
      <SandboxBench useDrag={dnd.useDrag} useDrop={dnd.useDrop} />
    </dnd.DndProvider>
  );
};

export default ChemistrySandbox;
