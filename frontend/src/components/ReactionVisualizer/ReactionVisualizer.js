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
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        y: { title: { display: true, text: 'Energy' } },
        x: { title: { display: true, text: 'Progress' } }
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
    <div className="dashboard-card">
      <h3>{rxn.title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ marginBottom: 8 }}>
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="water">Water Formation</option>
              <option value="neutralization">Acid–Base Neutralization</option>
              <option value="combustion">Methane Combustion</option>
            </select>
          </div>
          <div style={{ fontSize: 18, marginBottom: 8 }}>{rxn.equation}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 8 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reactions..."
              style={{ padding: 8 }}
            />
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {filteredKeys.map((k) => (
                <option key={k} value={k}>{reactions[k].title}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button onClick={() => setStep((s) => Math.max(0, s - 1))}>◀</button>
            <button onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
            <button onClick={() => setStep((s) => Math.min(maxStep, s + 1))}>▶</button>
            <input
              type="range"
              min={0}
              max={maxStep}
              step={1}
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <div>{step + 1}/{rxn.steps.length}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: '#f7f7fb' }}>
            <div style={{ fontWeight: 600 }}>{rxn.steps[step].label}</div>
            <div>{rxn.steps[step].desc}</div>
          </div>
        </div>
        <div>
          <Line data={chartData} options={chartOptions} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            <div>
              <div style={{ marginBottom: 6 }}>3D View Style</div>
              <select value={style} onChange={(e) => setStyle(e.target.value)} style={{ width: '100%' }}>
                <option value="stick">Stick</option>
                <option value="ballstick">Ball & Stick</option>
                <option value="spacefill">Space Fill</option>
              </select>
            </div>
            <div />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Reactants</div>
              <div ref={reactantsRef} style={{ width: '100%', height: 220, border: '1px solid #eee', borderRadius: 8 }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Products</div>
              <div ref={productsRef} style={{ width: '100%', height: 220, border: '1px solid #eee', borderRadius: 8 }} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Stoichiometry</div>
          <div style={{ marginBottom: 6 }}>Enter moles of reactants</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {reactantKeys.map((r) => (
              <div key={r} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ width: 80 }}>{r}</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={inputs[r] ?? ''}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [r]: e.target.value }))}
                  style={{ flex: 1 }}
                />
              </div>
            ))}
          </div>
          {result ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 8 }}>Extent: {result.extent.toFixed(2)}</div>
              <div style={{ marginBottom: 4 }}>Products (moles):</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {productKeys.map((p) => (
                  <div key={p} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ width: 80 }}>{p}</label>
                    <div>{result.products[p].toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, marginBottom: 4 }}>Leftover Reactants (moles):</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {reactantKeys.map((r) => (
                  <div key={r} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ width: 80 }}>{r}</label>
                    <div>{result.leftovers[r].toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 12, color: '#6b7280' }}>Enter reactant amounts to calculate products and leftovers.</div>
          )}
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Key Ideas</div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            <li>Use the slider or play controls to move through the reaction.</li>
            <li>The energy profile highlights activation energy and products.</li>
            <li>Try different reactions from the dropdown.</li>
            <li>Use stoichiometry to see limiting reagent effects.</li>
            <li>Reactants render on the left and products on the right in 3D.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReactionVisualizer;
