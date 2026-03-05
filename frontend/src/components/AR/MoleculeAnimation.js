import React, { useState, useEffect, useRef } from 'react';
import '3dmol';

const MoleculeAnimation = () => {
  const [molecule, setMolecule] = useState('H2O');
  const [style, setStyle] = useState('stick');
  const [autoRotate, setAutoRotate] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentCid, setCurrentCid] = useState(962);
  const [molMetadata, setMolMetadata] = useState({ title: 'Water', formula: 'H2O' });
  const viewerRef = useRef(null);
  const viewerInstance = useRef(null);
  const labelsAdded = useRef(false);
  const [selectedAtom, setSelectedAtom] = useState(null);

  const MOLECULE_CIDS = {
    H2O: 962,
    CH4: 297,
    C6H6: 241,
    C2H5OH: 702
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setSelectedAtom(null);

    try {
      // 1. Search for CID by name
      const searchRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(searchTerm)}/cids/JSON`);
      const searchData = await searchRes.json();

      if (searchData.IdentifierList?.CID?.[0]) {
        const cid = searchData.IdentifierList.CID[0];
        
        // 2. Fetch metadata (Title, Formula) for the CID
        const metaRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/Title,MolecularFormula/JSON`);
        const metaData = await metaRes.json();
        const prop = metaData.PropertyTable?.Properties?.[0];

        const newMetadata = {
          title: prop?.Title || searchTerm,
          formula: prop?.MolecularFormula || ''
        };

        setMolMetadata(newMetadata);
        setMolecule('custom');
        // Update currentCid last to trigger the download effect
        setCurrentCid(cid);
        // Force re-run download effect even if CID is the same
        if (cid === currentCid) {
          triggerDownload(cid);
        }
      } else {
        setSearchError('Molecule not found. Try another name or formula.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Network error while searching PubChem.');
    } finally {
      setIsSearching(false);
    }
  };

  const triggerDownload = (cid) => {
    const viewer = viewerInstance.current;
    if (!viewer) return;
    viewer.clear();

    try {
      $3Dmol.download(`cid:${cid}`, viewer, { keepH: true }, function () {
        try {
          const model = viewer.getModel();
          if (model) {
            model.computeBonds();
          }
          applyStyle();
          viewer.setViewStyle({ style: { cartoon: false } });
          viewer.zoomTo();
          if (autoRotate) viewer.spin('y', 1);
          else viewer.stopSpin();
          applyLabels();
          
          viewer.setHoverable({}, true, function (atom) {
            if (!showLabels || !atom) return;
            viewer.addLabel(atom.elem, { position: atom, backgroundOpacity: 0.6, fontSize: 12 });
          }, function () {
            if (showLabels) viewer.removeAllLabels();
          });

          viewer.setClickable({}, true, function (atom) {
            if (!atom) return;
            setSelectedAtom({ elem: atom.elem, serial: atom.serial, x: atom.x, y: atom.y, z: atom.z });
            applyStyle();
            viewer.setStyle({ serial: atom.serial }, { sphere: { scale: 0.6, color: 'yellow' }, stick: { color: 'yellow', radius: 0.25 } });
            viewer.setStyle({ within: { distance: 2.0, sel: { serial: atom.serial } } }, { stick: { color: 'orange', radius: 0.2 } });
            viewer.render();
          });
          viewer.render();
        } catch (innerErr) {
          console.error('3Dmol render error:', innerErr);
        }
      });
    } catch (err) {
      console.error('3Dmol download error:', err);
    }
  };

  const handleSelectPopular = (val) => {
    const popularMeta = {
      H2O: { title: 'Water', formula: 'H2O' },
      CH4: { title: 'Methane', formula: 'CH4' },
      C6H6: { title: 'Benzene', formula: 'C6H6' },
      C2H5OH: { title: 'Ethanol', formula: 'C2H5OH' }
    };
    
    setMolecule(val);
    setMolMetadata(popularMeta[val]);
    setCurrentCid(MOLECULE_CIDS[val]);
    setSearchTerm('');
    setSearchError('');
    setSelectedAtom(null);
  };

  const ELEMENT_INFO = {
    H: { name: 'Hydrogen', atomicNumber: 1 },
    C: { name: 'Carbon', atomicNumber: 6 },
    O: { name: 'Oxygen', atomicNumber: 8 },
    N: { name: 'Nitrogen', atomicNumber: 7 },
    S: { name: 'Sulfur', atomicNumber: 16 },
    P: { name: 'Phosphorus', atomicNumber: 15 },
    F: { name: 'Fluorine', atomicNumber: 9 },
    Cl: { name: 'Chlorine', atomicNumber: 17 },
    Br: { name: 'Bromine', atomicNumber: 35 },
    I: { name: 'Iodine', atomicNumber: 53 },
    Fe: { name: 'Iron', atomicNumber: 26 },
    Cu: { name: 'Copper', atomicNumber: 29 },
    Mg: { name: 'Magnesium', atomicNumber: 12 },
    Ca: { name: 'Calcium', atomicNumber: 20 },
    Na: { name: 'Sodium', atomicNumber: 11 },
    K: { name: 'Potassium', atomicNumber: 19 }
  };

  const MOLECULE_INFO = {
    H2O: { title: 'Water', geometry: 'Bent (~104.5°)', notes: 'Polar molecule; hydrogen bonding' },
    CH4: { title: 'Methane', geometry: 'Tetrahedral (~109.5°)', notes: 'Non-polar; sp3 hybridization' },
    C6H6: { title: 'Benzene', geometry: 'Planar aromatic ring', notes: 'Resonance; delocalized π electrons' },
    C2H5OH: { title: 'Ethanol', geometry: 'C–C single bond; OH group', notes: 'Polar; hydrogen bonding' }
  };

  const applyStyle = () => {
    const viewer = viewerInstance.current;
    if (!viewer) return;
    viewer.setStyle({}, {});
    if (style === 'stick') viewer.setStyle({}, { stick: {} });
    if (style === 'ballstick') viewer.setStyle({}, { stick: {}, sphere: { scale: 0.3 } });
    if (style === 'spacefill') viewer.setStyle({}, { sphere: { scale: 1 } });
    viewer.render();
  };

  const applyLabels = () => {
    const viewer = viewerInstance.current;
    if (!viewer) return;
    viewer.removeAllLabels();
    labelsAdded.current = false;
    if (!showLabels) {
      viewer.render();
      return;
    }
    const model = viewer.getModel();
    if (!model) return;
    const atoms = model.selectedAtoms({});
    for (let i = 0; i < atoms.length; i++) {
      const a = atoms[i];
      viewer.addLabel(a.elem, { position: { x: a.x, y: a.y, z: a.z }, backgroundOpacity: 0.6, fontSize: 12 });
    }
    labelsAdded.current = true;
    viewer.render();
  };

  useEffect(() => {
    const $3Dmol = window.$3Dmol;

    if (!$3Dmol || !viewerRef.current) {
      return;
    }

    if (!viewerInstance.current) {
      viewerInstance.current = $3Dmol.createViewer(viewerRef.current, {
        backgroundColor: 'white'
      });
    }

    if (currentCid) {
      triggerDownload(currentCid);
    }

  }, [currentCid]);

  useEffect(() => {
    const viewer = viewerInstance.current;
    if (!viewer) return;
    if (autoRotate) viewer.spin('y', 1);
    else viewer.stopSpin();
    viewer.render();
  }, [autoRotate]);

  useEffect(() => {
    applyStyle();
    applyLabels();
  }, [style, showLabels]);

  return (
    <div className="dashboard-card">
      <h3>3D Molecule Viewer</h3>
      
      {/* Search Section */}
      <div style={{ marginBottom: 16 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input 
            type="text" 
            placeholder="Search any molecule (e.g. Caffeine, Aspirin, CO2)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button 
            type="submit" 
            disabled={isSearching}
            style={{ padding: '8px 16px', borderRadius: 6, background: '#0077b6', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
        {searchError && <div style={{ color: '#d00', fontSize: 12, marginTop: 4 }}>{searchError}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ marginBottom: 6 }}>Popular Molecules</div>
          <select value={molecule} onChange={(e) => handleSelectPopular(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6 }}>
            <option value="H2O">Water</option>
            <option value="CH4">Methane</option>
            <option value="C6H6">Benzene</option>
            <option value="C2H5OH">Ethanol</option>
            {molecule === 'custom' && <option value="custom">Search Result</option>}
          </select>
        </div>
        <div>
          <div style={{ marginBottom: 6 }}>View Style</div>
          <select value={style} onChange={(e) => setStyle(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6 }}>
            <option value="stick">Stick</option>
            <option value="ballstick">Ball & Stick</option>
            <option value="spacefill">Space Fill</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
          Auto-rotate
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
          Show labels
        </label>
        <button 
          onClick={() => { if (viewerInstance.current) { viewerInstance.current.zoomTo(); viewerInstance.current.render(); } }}
          style={{ padding: '4px 8px', borderRadius: 4, background: '#eee', border: '1px solid #ccc', cursor: 'pointer' }}
        >
          Reset View
        </button>
      </div>

      <div ref={viewerRef} style={{ width: '100%', height: '500px', position: 'relative', border: '1px solid #eee', borderRadius: 8, background: '#fff' }}></div>
      
      <div style={{ marginTop: 12, padding: 12, background: '#f7f7fb', borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 18 }}>{molMetadata.title}</div>
        <div style={{ marginBottom: 4 }}>Formula: <strong>{molMetadata.formula}</strong></div>
        {molecule !== 'custom' && <div style={{ color: '#4b5563', fontSize: 14 }}>{MOLECULE_INFO[molecule]?.notes}</div>}
        
        {selectedAtom && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#0077b6' }}>Selected Atom</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 13 }}>
              <div>Element: <strong>{ELEMENT_INFO[selectedAtom.elem]?.name || selectedAtom.elem} ({selectedAtom.elem})</strong></div>
              <div>Atomic No: <strong>{ELEMENT_INFO[selectedAtom.elem]?.atomicNumber ?? '—'}</strong></div>
              <div>Position: <strong>({selectedAtom.x.toFixed(2)}, {selectedAtom.y.toFixed(2)}, {selectedAtom.z.toFixed(2)})</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoleculeAnimation;
