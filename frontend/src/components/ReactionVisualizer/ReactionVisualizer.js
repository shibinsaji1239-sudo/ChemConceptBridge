import React, { useEffect, useMemo, useRef, useState } from 'react';
import '3dmol';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const reactions = {
  water: {
    title: 'Water Formation',
    equation: '2H₂ + O₂ → 2H₂O',
    reactants: [{ cid: 783 }, { cid: 783 }, { cid: 977 }],
    products: [{ cid: 962 }, { cid: 962 }],
    steps: [
      { label: 'Reactants Approach', desc: 'H₂ molecules approach O₂' },
      { label: 'Collision', desc: 'Effective collision between H₂ and O₂' },
      { label: 'Transition State', desc: 'Old bonds weaken, new bonds start forming' },
      { label: 'Products', desc: 'Water molecules form' }
    ],
    energy: [10, 25, 35, -15],
    stoich: {
      reactants: { H2: 2, O2: 1 },
      products: { H2O: 2 }
    }
  },
  neutralization: {
    title: 'Acid–Base Neutralization',
    equation: 'HCl + NaOH → NaCl + H₂O',
    reactants: [{ cid: 313 }, { cid: 14798 }],
    products: [{ cid: 5234 }, { cid: 962 }],
    steps: [
      { label: 'Ions in Solution', desc: 'H⁺ and OH⁻ present in solution' },
      { label: 'Collision', desc: 'H⁺ meets OH⁻' },
      { label: 'Transition State', desc: 'Hydration shell reorganizes' },
      { label: 'Products', desc: 'Water forms, salt remains' }
    ],
    energy: [5, 15, 18, -8],
    stoich: {
      reactants: { HCl: 1, NaOH: 1 },
      products: { NaCl: 1, H2O: 1 }
    }
  },
  combustion: {
    title: 'Methane Combustion',
    equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
    reactants: [{ cid: 297 }, { cid: 977 }, { cid: 977 }],
    products: [{ cid: 280 }, { cid: 962 }, { cid: 962 }],
    steps: [
      { label: 'Reactants', desc: 'CH₄ mixes with O₂' },
      { label: 'Activation', desc: 'Bonds stretch and break' },
      { label: 'Transition State', desc: 'Rearrangement to products' },
      { label: 'Products', desc: 'CO₂ and H₂O formed' }
    ],
    energy: [15, 40, 50, -25],
    stoich: {
      reactants: { CH4: 1, O2: 2 },
      products: { CO2: 1, H2O: 2 }
    }
  },
  ethanolCombustion: {
    title: 'Ethanol Combustion',
    equation: 'C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O',
    reactants: [{ cid: 702 }, { cid: 977 }, { cid: 977 }, { cid: 977 }],
    products: [{ cid: 280 }, { cid: 280 }, { cid: 962 }, { cid: 962 }, { cid: 962 }],
    steps: [
      { label: 'Reactants', desc: 'Ethanol mixes with oxygen' },
      { label: 'Activation', desc: 'Bonds begin to break and form' },
      { label: 'Transition State', desc: 'Rearrangement to products' },
      { label: 'Products', desc: 'CO₂ and H₂O formed' }
    ],
    energy: [18, 45, 55, -30],
    stoich: {
      reactants: { C2H5OH: 1, O2: 3 },
      products: { CO2: 2, H2O: 3 }
    }
  },
  ammoniaSynthesis: {
    title: 'Ammonia Synthesis',
    equation: 'N₂ + 3H₂ → 2NH₃',
    reactants: [{ cid: 947 }, { cid: 783 }, { cid: 783 }, { cid: 783 }],
    products: [{ cid: 222 }, { cid: 222 }],
    steps: [
      { label: 'Reactants', desc: 'Nitrogen meets hydrogen' },
      { label: 'Activation', desc: 'Strong N≡N bond weakens' },
      { label: 'Transition State', desc: 'New N–H bonds form' },
      { label: 'Products', desc: 'Ammonia formed' }
    ],
    energy: [20, 60, 65, -10],
    stoich: {
      reactants: { N2: 1, H2: 3 },
      products: { NH3: 2 }
    }
  }
};

const ReactionVisualizer = () => {
  const [selected, setSelected] = useState('water');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [inputs, setInputs] = useState({});
  const timerRef = useRef(null);
  const reactantsRef = useRef(null);
  const productsRef = useRef(null);
  const reactantsViewer = useRef(null);
  const productsViewer = useRef(null);
  const [style, setStyle] = useState('stick');

  const rxn = reactions[selected];
  const maxStep = rxn.steps.length - 1;
  const [search, setSearch] = useState('');
  const reactionKeys = Object.keys(reactions);
  const filteredKeys = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reactionKeys;
    return reactionKeys.filter((k) => {
      const r = reactions[k];
      return r.title.toLowerCase().includes(q) || r.equation.toLowerCase().includes(q) || k.toLowerCase().includes(q);
    });
  }, [search]);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setStep((s) => (s < maxStep ? s + 1 : 0));
      }, 1500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, maxStep]);

  useEffect(() => {
    setStep(0);
    setPlaying(false);
    setInputs({});
  }, [selected]);

  const chartData = useMemo(() => {
    const labels = rxn.steps.map((s) => s.label);
    return {
      labels,
      datasets: [
        {
          label: 'Relative Energy',
          data: rxn.energy,
          borderColor: 'rgba(99, 102, 241, 1)',
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          tension: 0.3,
          pointRadius: labels.map((_, i) => (i === step ? 6 : 3)),
          pointBackgroundColor: labels.map((_, i) => (i === step ? 'rgba(34,197,94,0.9)' : 'rgba(99,102,241,1)'))
        }
      ]
    };
  }, [rxn, step]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        y: { 
          title: { display: false },
          ticks: { font: { size: 10 } }
        },
        x: { 
           title: { display: false },
           ticks: { font: { size: 10 } }
        }
      }
    }),
    []
  );

  const reactantKeys = Object.keys(rxn.stoich.reactants);
  const productKeys = Object.keys(rxn.stoich.products);

  const computeStoich = () => {
    const ratios = reactantKeys.map((r) => {
      const need = rxn.stoich.reactants[r];
      const have = Number(inputs[r] || 0);
      if (need <= 0) return Infinity;
      return have / need;
    });
    const extent = Math.min(...ratios);
    if (!isFinite(extent) || extent <= 0) return null;
    const products = {};
    productKeys.forEach((p) => {
      products[p] = extent * rxn.stoich.products[p];
    });
    const leftovers = {};
    reactantKeys.forEach((r, i) => {
      const have = Number(inputs[r] || 0);
      leftovers[r] = Math.max(0, have - extent * rxn.stoich.reactants[r]);
    });
    return { extent, products, leftovers };
  };

  const result = computeStoich();

  const loadViewerModels = (viewer, list) => {
    const $3Dmol = window.$3Dmol;
    if (!$3Dmol || !viewer) return;
    viewer.clear();
    let loaded = 0;
    if (!list || list.length === 0) {
      viewer.render();
      return;
    }
    list.forEach((item) => {
      $3Dmol.download(`cid:${item.cid}`, viewer, {}, function () {
        loaded += 1;
        if (loaded === list.length) {
          if (style === 'stick') viewer.setStyle({}, { stick: {} });
          if (style === 'ballstick') viewer.setStyle({}, { stick: {}, sphere: { scale: 0.3 } });
          if (style === 'spacefill') viewer.setStyle({}, { sphere: { scale: 1 } });
          viewer.zoomTo();
          viewer.render();
        }
      });
    });
  };

  useEffect(() => {
    const $3Dmol = window.$3Dmol;
    if (!$3Dmol) return;
    if (!reactantsViewer.current && reactantsRef.current) {
      reactantsViewer.current = $3Dmol.createViewer(reactantsRef.current, { backgroundColor: 'white' });
    }
    if (!productsViewer.current && productsRef.current) {
      productsViewer.current = $3Dmol.createViewer(productsRef.current, { backgroundColor: 'white' });
    }
    if (reactantsViewer.current && productsViewer.current) {
      if (step < maxStep) {
        loadViewerModels(reactantsViewer.current, rxn.reactants);
        productsViewer.current.clear();
        productsViewer.current.render();
      } else {
        loadViewerModels(productsViewer.current, rxn.products);
        reactantsViewer.current.clear();
        reactantsViewer.current.render();
      }
    }
  }, [rxn, step, style, maxStep]);

  return (
    <div className="dashboard-card rv-main-card">
      <div className="rv-top-row">
        <div className="rv-selection-panel">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="rv-select">
            {reactionKeys.map(k => (
              <option key={k} value={k}>{reactions[k].title}</option>
            ))}
          </select>
          <div className="rv-equation-small">{rxn.equation}</div>
        </div>

        <div className="rv-playback-panel">
          <div className="rv-controls-mini">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} className="rv-btn-mini">◀</button>
            <button onClick={() => setPlaying((p) => !p)} className="rv-btn-play-mini">{playing ? 'Pause' : 'Play'}</button>
            <button onClick={() => setStep((s) => Math.min(maxStep, s + 1))} className="rv-btn-mini">▶</button>
            <div className="rv-step-count-mini">{step + 1}/{rxn.steps.length}</div>
          </div>
          <input
            type="range"
            min={0}
            max={maxStep}
            step={1}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="rv-slider-mini"
          />
        </div>

        <div className="rv-stoich-panel-mini">
           <div className="rv-stoich-grid-mini">
             {reactantKeys.map(r => (
               <div key={r} className="rv-stoich-item-mini">
                 <span>{r}:</span>
                 <input
                   type="number"
                   value={inputs[r] ?? ''}
                   onChange={(e) => setInputs(prev => ({ ...prev, [r]: e.target.value }))}
                   className="rv-input-mini"
                 />
               </div>
             ))}
           </div>
           {result && <div className="rv-extent-mini">Yield: {result.extent.toFixed(1)}x</div>}
        </div>
      </div>

      <div className="rv-main-grid">
        <div className="rv-chart-container-compact">
          <div className="rv-panel-label">Energy Profile</div>
          <div className="rv-chart-wrapper-compact">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="rv-visual-container-compact">
          <div className="rv-model-box">
             <div className="rv-panel-label">Reactants</div>
             <div ref={reactantsRef} className="rv-3d-viewer-compact" />
          </div>
          <div className="rv-model-box">
             <div className="rv-panel-label">Products</div>
             <div ref={productsRef} className="rv-3d-viewer-compact" />
          </div>
        </div>
      </div>

      <div className="rv-footer-info">
        <div className="rv-step-info-compact">
          <span className="rv-step-label-compact">{rxn.steps[step].label}:</span> {rxn.steps[step].desc}
        </div>
      </div>
    </div>
  );
};

export default ReactionVisualizer;
