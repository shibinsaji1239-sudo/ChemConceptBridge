import React, { useState } from 'react';
import './ChemistryCalculator.css';

const ChemistryCalculator = () => {
  const [activeTab, setActiveTab] = useState('molarity');
  const [results, setResults] = useState({});
  const [inputs, setInputs] = useState({
    molarity: { moles: '', volume: '', concentration: '' },
    dilution: { c1: '', v1: '', c2: '', v2: '' },
    ph: { concentration: '', acidType: 'strong' },
    stoichiometry: { reactant1: '', reactant2: '', product1: '', product2: '', mass1: '' },
    titration: { M1: '', V1: '', M2: '', V2: '', a: '1', b: '1', unknown: 'M1' }
  });

  const calculateMolarity = () => {
    const { moles, volume, concentration } = inputs.molarity;
    const results = {};

    if (moles && volume) {
      results.molarity = (parseFloat(moles) / parseFloat(volume)).toFixed(4);
    }
    if (concentration && volume) {
      results.moles = (parseFloat(concentration) * parseFloat(volume)).toFixed(4);
    }
    if (moles && concentration) {
      results.volume = (parseFloat(moles) / parseFloat(concentration)).toFixed(4);
    }

    setResults({ ...results, type: 'molarity' });
  };

  const calculateDilution = () => {
    const { c1, v1, c2, v2 } = inputs.dilution;
    const results = {};

    if (c1 && v1 && c2) {
      results.v2 = ((parseFloat(c1) * parseFloat(v1)) / parseFloat(c2)).toFixed(4);
    }
    if (c1 && v1 && v2) {
      results.c2 = ((parseFloat(c1) * parseFloat(v1)) / parseFloat(v2)).toFixed(4);
    }
    if (c2 && v2 && v1) {
      results.c1 = ((parseFloat(c2) * parseFloat(v2)) / parseFloat(v1)).toFixed(4);
    }
    if (c1 && c2 && v2) {
      results.v1 = ((parseFloat(c2) * parseFloat(v2)) / parseFloat(c1)).toFixed(4);
    }

    setResults({ ...results, type: 'dilution' });
  };

  const calculatePH = () => {
    const { concentration, acidType } = inputs.ph;
    const results = {};

    if (concentration) {
      const conc = parseFloat(concentration);
      if (acidType === 'strong') {
        results.pH = (-Math.log10(conc)).toFixed(2);
        results.pOH = (14 - results.pH).toFixed(2);
      } else {
        // Weak acid approximation
        results.pH = (-Math.log10(Math.sqrt(conc * 1.8e-5))).toFixed(2);
        results.pOH = (14 - results.pH).toFixed(2);
      }
      results.hydronium = conc.toExponential(2);
      results.hydroxide = (1e-14 / conc).toExponential(2);
    }

    setResults({ ...results, type: 'ph' });
  };

  const calculateStoichiometry = () => {
    const { reactant1, reactant2, product1, product2, mass1 } = inputs.stoichiometry;
    const results = {};

    // Simple stoichiometry calculation (would need proper molecular weights in real app)
    if (reactant1 && reactant2 && product1 && product2 && mass1) {
      const mass = parseFloat(mass1);
      // This is a simplified calculation - in reality you'd need molecular weights
      results.molesReactant1 = (mass / 100).toFixed(4); // Assuming MW = 100 g/mol
      results.molesProduct1 = results.molesReactant1; // 1:1 ratio assumed
      results.massProduct1 = (results.molesProduct1 * 100).toFixed(2); // Assuming MW = 100 g/mol
    }

    setResults({ ...results, type: 'stoichiometry' });
  };

  const calculateTitration = () => {
    const { M1, V1, M2, V2, a, b, unknown } = inputs.titration;
    const A = parseFloat(a || '1');
    const B = parseFloat(b || '1');
    const r = {};
    const f = (x) => parseFloat(x);
    if (unknown === 'M1' && V1 && M2 && V2) r.M1 = ((f(M2) * f(V2) * B) / (f(V1) * A)).toFixed(6);
    if (unknown === 'V1' && M1 && M2 && V2) r.V1 = ((f(M2) * f(V2) * B) / (f(M1) * A)).toFixed(6);
    if (unknown === 'M2' && M1 && V1 && V2) r.M2 = ((f(M1) * f(V1) * A) / (f(V2) * B)).toFixed(6);
    if (unknown === 'V2' && M1 && V1 && M2) r.V2 = ((f(M1) * f(V1) * A) / (f(M2) * B)).toFixed(6);
    setResults({ ...r, type: 'titration' });
  };

  const handleInputChange = (category, field, value) => {
    setInputs(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const clearInputs = (category) => {
    setInputs(prev => ({
      ...prev,
      [category]: Object.keys(prev[category]).reduce((acc, key) => {
        acc[key] = '';
        return acc;
      }, {})
    }));
    setResults({});
  };

  const renderMolarityCalculator = () => (
    <div className="calculator-section">
      <h3>Molarity Calculator</h3>
      <p>Calculate molarity, moles, or volume using the formula: M = n/V</p>
      
      <div className="input-group">
        <label>Moles (mol):</label>
        <input
          type="number"
          value={inputs.molarity.moles}
          onChange={(e) => handleInputChange('molarity', 'moles', e.target.value)}
          placeholder="Enter moles"
        />
      </div>
      
      <div className="input-group">
        <label>Volume (L):</label>
        <input
          type="number"
          value={inputs.molarity.volume}
          onChange={(e) => handleInputChange('molarity', 'volume', e.target.value)}
          placeholder="Enter volume in liters"
        />
      </div>
      
      <div className="input-group">
        <label>Concentration (M):</label>
        <input
          type="number"
          value={inputs.molarity.concentration}
          onChange={(e) => handleInputChange('molarity', 'concentration', e.target.value)}
          placeholder="Enter molarity"
        />
      </div>
      
      <div className="button-group">
        <button onClick={calculateMolarity} className="calculate-btn">Calculate</button>
        <button onClick={() => clearInputs('molarity')} className="clear-btn">Clear</button>
      </div>
      
      {results.type === 'molarity' && (
        <div className="results">
          {results.molarity && <div>Molarity: {results.molarity} M</div>}
          {results.moles && <div>Moles: {results.moles} mol</div>}
          {results.volume && <div>Volume: {results.volume} L</div>}
        </div>
      )}
    </div>
  );

  const renderDilutionCalculator = () => (
    <div className="calculator-section">
      <h3>Dilution Calculator</h3>
      <p>Use C₁V₁ = C₂V₂ to calculate dilutions</p>
      
      <div className="input-group">
        <label>Initial Concentration (M):</label>
        <input
          type="number"
          value={inputs.dilution.c1}
          onChange={(e) => handleInputChange('dilution', 'c1', e.target.value)}
          placeholder="C₁"
        />
      </div>
      
      <div className="input-group">
        <label>Initial Volume (L):</label>
        <input
          type="number"
          value={inputs.dilution.v1}
          onChange={(e) => handleInputChange('dilution', 'v1', e.target.value)}
          placeholder="V₁"
        />
      </div>
      
      <div className="input-group">
        <label>Final Concentration (M):</label>
        <input
          type="number"
          value={inputs.dilution.c2}
          onChange={(e) => handleInputChange('dilution', 'c2', e.target.value)}
          placeholder="C₂"
        />
      </div>
      
      <div className="input-group">
        <label>Final Volume (L):</label>
        <input
          type="number"
          value={inputs.dilution.v2}
          onChange={(e) => handleInputChange('dilution', 'v2', e.target.value)}
          placeholder="V₂"
        />
      </div>
      
      <div className="button-group">
        <button onClick={calculateDilution} className="calculate-btn">Calculate</button>
        <button onClick={() => clearInputs('dilution')} className="clear-btn">Clear</button>
      </div>
      
      {results.type === 'dilution' && (
        <div className="results">
          {results.c1 && <div>Initial Concentration: {results.c1} M</div>}
          {results.v1 && <div>Initial Volume: {results.v1} L</div>}
          {results.c2 && <div>Final Concentration: {results.c2} M</div>}
          {results.v2 && <div>Final Volume: {results.v2} L</div>}
        </div>
      )}
    </div>
  );

  const renderPHCalculator = () => (
    <div className="calculator-section">
      <h3>pH Calculator</h3>
      <p>Calculate pH, pOH, and ion concentrations</p>
      
      <div className="input-group">
        <label>Acid Type:</label>
        <select
          value={inputs.ph.acidType}
          onChange={(e) => handleInputChange('ph', 'acidType', e.target.value)}
        >
          <option value="strong">Strong Acid</option>
          <option value="weak">Weak Acid</option>
        </select>
      </div>
      
      <div className="input-group">
        <label>Concentration (M):</label>
        <input
          type="number"
          value={inputs.ph.concentration}
          onChange={(e) => handleInputChange('ph', 'concentration', e.target.value)}
          placeholder="Enter concentration"
        />
      </div>
      
      <div className="button-group">
        <button onClick={calculatePH} className="calculate-btn">Calculate</button>
        <button onClick={() => clearInputs('ph')} className="clear-btn">Clear</button>
      </div>
      
      {results.type === 'ph' && (
        <div className="results">
          {results.pH && <div>pH: {results.pH}</div>}
          {results.pOH && <div>pOH: {results.pOH}</div>}
          {results.hydronium && <div>[H₃O⁺]: {results.hydronium} M</div>}
          {results.hydroxide && <div>[OH⁻]: {results.hydroxide} M</div>}
        </div>
      )}
    </div>
  );

  const renderStoichiometryCalculator = () => (
    <div className="calculator-section">
      <h3>Stoichiometry Calculator</h3>
      <p>Calculate reaction quantities (simplified version)</p>
      
      <div className="input-group">
        <label>Reactant 1:</label>
        <input
          type="text"
          value={inputs.stoichiometry.reactant1}
          onChange={(e) => handleInputChange('stoichiometry', 'reactant1', e.target.value)}
          placeholder="e.g., H₂SO₄"
        />
      </div>
      
      <div className="input-group">
        <label>Reactant 2:</label>
        <input
          type="text"
          value={inputs.stoichiometry.reactant2}
          onChange={(e) => handleInputChange('stoichiometry', 'reactant2', e.target.value)}
          placeholder="e.g., NaOH"
        />
      </div>
      
      <div className="input-group">
        <label>Product 1:</label>
        <input
          type="text"
          value={inputs.stoichiometry.product1}
          onChange={(e) => handleInputChange('stoichiometry', 'product1', e.target.value)}
          placeholder="e.g., Na₂SO₄"
        />
      </div>
      
      <div className="input-group">
        <label>Product 2:</label>
        <input
          type="text"
          value={inputs.stoichiometry.product2}
          onChange={(e) => handleInputChange('stoichiometry', 'product2', e.target.value)}
          placeholder="e.g., H₂O"
        />
      </div>
      
      <div className="input-group">
        <label>Mass of Reactant 1 (g):</label>
        <input
          type="number"
          value={inputs.stoichiometry.mass1}
          onChange={(e) => handleInputChange('stoichiometry', 'mass1', e.target.value)}
          placeholder="Enter mass"
        />
      </div>
      
      <div className="button-group">
        <button onClick={calculateStoichiometry} className="calculate-btn">Calculate</button>
        <button onClick={() => clearInputs('stoichiometry')} className="clear-btn">Clear</button>
      </div>
      
      {results.type === 'stoichiometry' && (
        <div className="results">
          {results.molesReactant1 && <div>Moles of Reactant 1: {results.molesReactant1} mol</div>}
          {results.molesProduct1 && <div>Moles of Product 1: {results.molesProduct1} mol</div>}
          {results.massProduct1 && <div>Mass of Product 1: {results.massProduct1} g</div>}
        </div>
      )}
    </div>
  );

  const renderTitrationCalculator = () => (
    <div className="calculator-section">
      <h3>Titration Calculator</h3>
      <p>Use M1×V1×a = M2×V2×b. Choose the unknown and enter the others.</p>

      <div className="input-group">
        <label>Unknown:</label>
        <select
          value={inputs.titration.unknown}
          onChange={(e) => handleInputChange('titration', 'unknown', e.target.value)}
        >
          <option value="M1">M1</option>
          <option value="V1">V1</option>
          <option value="M2">M2</option>
          <option value="V2">V2</option>
        </select>
      </div>

      <div className="input-group">
        <label>M1 (M):</label>
        <input
          type="number"
          disabled={inputs.titration.unknown === 'M1'}
          value={inputs.titration.M1}
          onChange={(e) => handleInputChange('titration', 'M1', e.target.value)}
          placeholder="M1"
        />
      </div>
      <div className="input-group">
        <label>V1 (mL):</label>
        <input
          type="number"
          disabled={inputs.titration.unknown === 'V1'}
          value={inputs.titration.V1}
          onChange={(e) => handleInputChange('titration', 'V1', e.target.value)}
          placeholder="V1"
        />
      </div>
      <div className="input-group">
        <label>M2 (M):</label>
        <input
          type="number"
          disabled={inputs.titration.unknown === 'M2'}
          value={inputs.titration.M2}
          onChange={(e) => handleInputChange('titration', 'M2', e.target.value)}
          placeholder="M2"
        />
      </div>
      <div className="input-group">
        <label>V2 (mL):</label>
        <input
          type="number"
          disabled={inputs.titration.unknown === 'V2'}
          value={inputs.titration.V2}
          onChange={(e) => handleInputChange('titration', 'V2', e.target.value)}
          placeholder="V2"
        />
      </div>

      <div className="input-group">
        <label>a (analyte equivalents):</label>
        <input
          type="number"
          value={inputs.titration.a}
          onChange={(e) => handleInputChange('titration', 'a', e.target.value)}
          placeholder="a"
        />
      </div>
      <div className="input-group">
        <label>b (titrant equivalents):</label>
        <input
          type="number"
          value={inputs.titration.b}
          onChange={(e) => handleInputChange('titration', 'b', e.target.value)}
          placeholder="b"
        />
      </div>

      <div className="button-group">
        <button onClick={calculateTitration} className="calculate-btn">Calculate</button>
        <button onClick={() => clearInputs('titration')} className="clear-btn">Clear</button>
      </div>

      {results.type === 'titration' && (
        <div className="results">
          {results.M1 && <div>M1: {results.M1} M</div>}
          {results.V1 && <div>V1: {results.V1} mL</div>}
          {results.M2 && <div>M2: {results.M2} M</div>}
          {results.V2 && <div>V2: {results.V2} mL</div>}
        </div>
      )}
    </div>
  );

  return (
    <div className="chemistry-calculator">
      <div className="cc-header">
        <h2>Chemistry Calculator</h2>
        <p>Essential chemistry calculations and conversions</p>
      </div>

      <div className="calculator-tabs">
        <button
          className={activeTab === 'titration' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('titration')}
        >
          Titration
        </button>
        <button
          className={activeTab === 'molarity' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('molarity')}
        >
          Molarity
        </button>
        <button
          className={activeTab === 'dilution' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('dilution')}
        >
          Dilution
        </button>
        <button
          className={activeTab === 'ph' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('ph')}
        >
          pH
        </button>
        <button
          className={activeTab === 'stoichiometry' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('stoichiometry')}
        >
          Stoichiometry
        </button>
      </div>

      <div className="calculator-content">
        {activeTab === 'titration' && renderTitrationCalculator()}
        {activeTab === 'molarity' && renderMolarityCalculator()}
        {activeTab === 'dilution' && renderDilutionCalculator()}
        {activeTab === 'ph' && renderPHCalculator()}
        {activeTab === 'stoichiometry' && renderStoichiometryCalculator()}
      </div>
    </div>
  );
};

export default ChemistryCalculator;
