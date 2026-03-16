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
  const [showBasics, setShowBasics] = useState(false);

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
        
        // Try to find a match in our Molecule Info for educational content
        const searchUpper = searchTerm.toUpperCase();
        const formulaUpper = newMetadata.formula.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, m => (m.charCodeAt(0) - 8320).toString()).toUpperCase();
        
        let matchKey = 'custom';
        for (const key in MOLECULE_INFO) {
          if (key.toUpperCase() === searchUpper || 
              key.toUpperCase() === formulaUpper || 
              MOLECULE_INFO[key].title.toUpperCase() === searchUpper ||
              MOLECULE_INFO[key].formula?.toUpperCase() === formulaUpper) {
            matchKey = key;
            break;
          }
        }
        
        setMolecule(matchKey);
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
      const $3Dmol = window.$3Dmol;
      if (!$3Dmol) return;
      $3Dmol.download(`cid:${cid}`, viewer, { keepH: true }, function () {
        try {
          const model = viewer.getModel();
          if (model) {
            model.computeBonds();
          }
          applyStyle();
          viewer.setViewStyle({ style: { cartoon: false } });
          viewer.zoomTo();
          viewer.resize(); // Ensure correct size after load
          viewer.render();
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
      C2H5OH: { title: 'Ethanol', formula: 'C2H5OH' },
      CO2: { title: 'Carbon Dioxide', formula: 'CO2' },
      NH3: { title: 'Ammonia', formula: 'NH3' },
      NaCl: { title: 'Table Salt', formula: 'NaCl' },
      HCl: { title: 'Hydrochloric Acid', formula: 'HCl' },
      O2: { title: 'Oxygen', formula: 'O2' },
      C6H12O6: { title: 'Glucose', formula: 'C6H12O6' },
      C12H22O11: { title: 'Sucrose', formula: 'C12H22O11' },
      C: { title: 'Diamond/Carbon', formula: 'C' },
      NaHCO3: { title: 'Baking Soda', formula: 'NaHCO3' },
      C10H14N2: { title: 'Nicotine', formula: 'C10H14N2' }
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

  const BASICS_101 = [
    { term: 'Atom', metaphor: 'Lego Brick', explanation: 'Everything in the world is made of tiny bricks called atoms. Just like Legos, different atoms have different colors and sizes.' },
    { term: 'Electron', metaphor: 'Little Hands', explanation: 'Atoms have "little hands" called electrons. They use these hands to grab onto other atoms.' },
    { term: 'Molecule', metaphor: 'Team or Family', explanation: 'When atoms grab each other and stay together, they form a "team" called a molecule.' },
    { term: 'Chemical Bond', metaphor: 'Holding Hands', explanation: 'A bond is just two atoms holding hands very tightly so they don\'t fall apart.' }
  ];

  const MOLECULE_INFO = {
    H2O: { 
      title: 'Water', 
      formula: 'H2O',
      geometry: 'Bent (~104.5°)', 
      notes: 'Essential for all life on Earth.',
      formation: [
        { step: 1, text: 'The Oxygen atom is like a captain; it has 2 empty "hands" to hold.' },
        { step: 2, text: 'Two tiny Hydrogen atoms come along and each grab one of the captain\'s hands.' },
        { step: 3, text: 'They hold hands so tightly that they stay together as a "V" shaped team.' }
      ],
      basicConcepts: [
        { term: 'Holding Hands', explanation: 'In chemistry, we call this "Bonding". It is how atoms stay together.' },
        { term: 'V-Shape', explanation: 'Because the atoms push each other slightly, they don\'t stay in a straight line.' }
      ]
    },
    CH4: { 
      title: 'Methane', 
      formula: 'CH4',
      geometry: 'Pyramid (Tetrahedral)', 
      notes: 'Commonly known as natural gas.',
      formation: [
        { step: 1, text: 'One Carbon atom (the center) has 4 "hands" ready to grab.' },
        { step: 2, text: 'Four small Hydrogen atoms come from all sides.' },
        { step: 3, text: 'Each Hydrogen grabs one Carbon hand, forming a balanced pyramid shape.' }
      ],
      basicConcepts: [
        { term: 'Perfect Balance', explanation: 'The 4 atoms spread out as far as possible, making a perfect pyramid.' },
        { term: 'Invisible Hands', explanation: 'These are "Electrons" that act like glue between the atoms.' }
      ]
    },
    C6H6: { 
      title: 'Benzene', 
      formula: 'C6H6',
      geometry: 'Flat Hexagon Ring', 
      notes: 'A famous ring-shaped molecule found in many scents.',
      formation: [
        { step: 1, text: 'Six Carbon atoms join together to form a flat "hula-hoop" ring.' },
        { step: 2, text: 'They share their extra hands in a big circle to make the ring very strong.' },
        { step: 3, text: 'Six Hydrogen atoms stick to the outside of the ring like decorations.' }
      ],
      basicConcepts: [
        { term: 'The Ring', explanation: 'A special "Circle" team that is much stronger than a straight line.' },
        { term: 'Sharing is Caring', explanation: 'All atoms in the ring share their hands together to stay flat.' }
      ]
    },
    C2H5OH: { 
      title: 'Ethanol', 
      formula: 'C2H5OH',
      geometry: 'Two carbons joined with an -OH tail', 
      notes: 'Common alcohol found in hand sanitizers.',
      formation: [
        { step: 1, text: 'Two Carbon atoms hold hands to make a short bridge.' },
        { step: 2, text: 'At one end, a team of Oxygen and Hydrogen (-OH) joins the bridge.' },
        { step: 3, text: 'The rest of the empty hands are filled by small Hydrogen atoms.' }
      ],
      basicConcepts: [
        { term: 'Carbon Bridge', explanation: 'Carbon can make long chains or small bridges, like a building set.' },
        { term: 'Special Tail', explanation: 'The -OH tail at the end makes this molecule different from others.' }
      ]
    },
    CO2: {
      title: 'Carbon Dioxide',
      formula: 'CO2',
      geometry: 'Straight Line (Linear)',
      notes: 'The gas we breathe out.',
      formation: [
        { step: 1, text: 'Carbon has 4 hands; two Oxygen atoms each have 2 hands.' },
        { step: 2, text: 'Carbon uses TWO hands for each Oxygen friend.' },
        { step: 3, text: 'Because they are pulling in opposite directions, it makes a straight line.' }
      ],
      basicConcepts: [
        { term: 'Double Grip', explanation: 'Holding hands with TWO hands instead of one makes the bond even stronger.' }
      ]
    },
    NH3: {
      title: 'Ammonia',
      formula: 'NH3',
      geometry: 'Small Umbrella (Pyramidal)',
      notes: 'Found in cleaning supplies.',
      formation: [
        { step: 1, text: 'Nitrogen at the top has 3 hands to hold and one "extra" invisible cloud.' },
        { step: 2, text: 'Three Hydrogens grab the hands.' },
        { step: 3, text: 'The invisible cloud at the top pushes the Hydrogens down like an umbrella.' }
      ],
      basicConcepts: [
        { term: 'The Cloud', explanation: 'An invisible area that pushes other atoms away.' }
      ]
    },
    C6H5Cl: {
      title: 'Chlorobenzene',
      formula: 'C6H5Cl',
      geometry: 'Benzene ring with one Chlorine',
      notes: 'Used in manufacturing plastics and dyes.',
      formation: [
        { step: 1, text: 'Start with the famous "Carbon Circle" (Benzene ring).' },
        { step: 2, text: 'One Hydrogen atom leaves the circle.' },
        { step: 3, text: 'A big Chlorine atom takes its place and grabs the Carbon hand.' }
      ],
      basicConcepts: [
        { term: 'Substitution', explanation: 'When one atom "swaps" places with another atom.' },
        { term: 'The Heavyweight', explanation: 'Chlorine is much bigger and heavier than the Hydrogen it replaced.' }
      ]
    },
    C8H10N4O2: {
      title: 'Caffeine',
      formula: 'C8H10N4O2',
      geometry: 'Double Ring System',
      notes: 'The "energy booster" in coffee and tea.',
      formation: [
        { step: 1, text: 'Two different rings join together side-by-side.' },
        { step: 2, text: 'Different types of atoms (Carbon and Nitrogen) build these rings.' },
        { step: 3, text: 'Small "Methyl" groups stick out like little antennae.' }
      ],
      basicConcepts: [
        { term: 'Complexity', explanation: 'Nature can build very big and complicated atoms teams.' }
      ]
    },
    C9H8O4: {
      title: 'Aspirin',
      formula: 'C9H8O4',
      geometry: 'Ring with two side-tails',
      notes: 'Used to treat headaches and pain.',
      formation: [
        { step: 1, text: 'A strong hexagonal ring forms the core body.' },
        { step: 2, text: 'Two special tails are added to the ring.' },
        { step: 3, text: 'The Acetyl tail is what makes this molecule a medicine.' }
      ],
      basicConcepts: [
        { term: 'Functional Team', explanation: 'Special groups of atoms change how the whole team works.' }
      ]
    },
    O2: {
      title: 'Oxygen',
      formula: 'O2',
      geometry: 'Straight Line',
      notes: 'The air we need to survive.',
      formation: [
        { step: 1, text: 'Two twin Oxygen atoms meet.' },
        { step: 2, text: 'They both need 2 more hands to feel safe.' },
        { step: 3, text: 'They hold hands with BOTH hands (Double Bond) and become inseparable.' }
      ],
      basicConcepts: [
        { term: 'Diatomic', explanation: 'Atoms that are such good friends they almost always travel in pairs.' }
      ]
    },
    C6H12O6: {
      title: 'Glucose',
      formula: 'C6H12O6',
      geometry: 'Big Hexagonal Ring',
      notes: 'Real-life "Sugar Power" for your body.',
      formation: [
        { step: 1, text: 'Six Carbon atoms link into a big ring with one Oxygen.' },
        { step: 2, text: 'Lots of Oxygen/Hydrogen pairs (-OH) stick out like berries.' },
        { step: 3, text: 'This big structure stores energy like a battery for your cells.' }
      ],
      basicConcepts: [
        { term: 'Energy Carrier', explanation: 'This molecule is like a portable battery for humans.' }
      ]
    },
    NaCl: {
      title: 'Table Salt',
      formula: 'NaCl',
      geometry: 'Cube Lattice',
      notes: 'The white crystals we use for seasoning food.',
      formation: [
        { step: 1, text: 'Sodium (Na) is a generous atom; it gives away one "hand" (electron).' },
        { step: 2, text: 'Chlorine (Cl) is a greedy atom; it takes that hand.' },
        { step: 3, text: 'Because one atom gave and one took, they stick together like magnets in a big cube.' }
      ],
      basicConcepts: [
        { term: 'Ionic Bond', explanation: 'Like a magnetic pull between two atoms that swapped hands.' },
        { term: 'Crystal', explanation: 'Millions of these atoms join to make a repeating pattern, like a tiled floor.' }
      ]
    },
    HCl: {
      title: 'Hydrochloric Acid',
      formula: 'HCl',
      geometry: 'Straight Line',
      notes: 'A strong acid found in your stomach to help digest food.',
      formation: [
        { step: 1, text: 'A small Hydrogen atom meets a big Chlorine atom.' },
        { step: 2, text: 'Chlorine is very strong and pulls the shared hand closer to itself.' },
        { step: 3, text: 'This "tug-of-war" makes the molecule very reactive.' }
      ],
      basicConcepts: [
        { term: 'Strong Acid', explanation: 'Something that is very good at giving away its Hydrogen "team member".' }
      ]
    },
    H2SO4: {
      title: 'Sulfuric Acid',
      formula: 'H2SO4',
      geometry: 'Tetrahedron Center',
      notes: 'One of the most powerful and important chemicals in industry.',
      formation: [
        { step: 1, text: 'Sulfur (S) sits in the center like a boss with 6 hands.' },
        { step: 2, text: 'Four Oxygen atoms surround it and grab those hands.' },
        { step: 3, text: 'Two Hydrogens stick to the outside Oxygen atoms to finish the team.' }
      ],
      basicConcepts: [
        { term: 'Central Hub', explanation: 'One big atom can hold many smaller ones at the same time.' }
      ]
    },
    C12H22O11: {
      title: 'Table Sugar',
      formula: 'C12H22O11',
      geometry: 'Double Ring',
      notes: 'The sweet stuff we put in tea and cakes.',
      formation: [
        { step: 1, text: 'Two different sugar rings (Glucose and Fructose) meet.' },
        { step: 2, text: 'They join together by throwing away one water molecule.' },
        { step: 3, text: 'This makes a big, double-ring structure that tastes sweet.' }
      ],
      basicConcepts: [
        { term: 'Disaccharide', explanation: 'A "double-team" of sugar molecules.' }
      ]
    },
    O3: {
      title: 'Ozone',
      formula: 'O3',
      geometry: 'Bent V-Shape',
      notes: 'The protective layer high in our atmosphere.',
      formation: [
        { step: 1, text: 'Three Oxygen twins try to hold hands at once.' },
        { step: 2, text: 'Because they are a "crowd", they have to bend into a V-shape.' },
        { step: 3, text: 'This molecule is unstable and wants to go back to being a pair (O2).' }
      ],
      basicConcepts: [
        { term: 'Atmosphere Shield', explanation: 'Ozone blocks dangerous high-energy light from the Sun.' }
      ]
    },
    CH3COOH: {
      title: 'Vinegar',
      formula: 'CH3COOH',
      geometry: 'Two carbons with an acid tail',
      notes: 'Commonly used in cooking and cleaning.',
      formation: [
        { step: 1, text: 'One Carbon holds 3 Hydrogens (the head).' },
        { step: 2, text: 'A second Carbon joins with two Oxygens (the tail).' },
        { step: 3, text: 'This "Acid Tail" is what gives vinegar its sour taste.' }
      ],
      basicConcepts: [
        { term: 'Organic Acid', explanation: 'Acids made by living things or containing Carbon.' }
      ]
    },
    C: {
      title: 'Diamond',
      formula: 'C',
      geometry: 'Infinite Tetrahedron',
      notes: 'The hardest natural material on Earth.',
      formation: [
        { step: 1, text: 'Every Carbon atom holds hands with 4 other Carbon friends.' },
        { step: 2, text: 'They form a never-ending 3D mesh, like a strong jungle gym.' },
        { step: 3, text: 'Because every single hand is occupied, it is impossible to break!' }
      ],
      basicConcepts: [
        { term: 'Lattice', explanation: 'A giant web of atoms that goes on and on.' },
        { term: 'Hardness', explanation: 'Diamonds are hard because every atom is locked tightly in place.' }
      ]
    }
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
    
    // Initial resize to ensure visibility
    setTimeout(() => {
      if (viewerInstance.current) {
        viewerInstance.current.resize();
        viewerInstance.current.render();
      }
    }, 100);

  }, [currentCid]);

  // Handle resizing when the layout changes
  useEffect(() => {
    if (viewerInstance.current) {
      setTimeout(() => {
        viewerInstance.current.resize();
        viewerInstance.current.render();
      }, 50);
    }
  }, [showBasics]);

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
          <select value={molecule} onChange={(e) => handleSelectPopular(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: '0.9rem', color: '#1e293b' }}>
            <option value="H2O">Water</option>
            <option value="CH4">Methane</option>
            <option value="C6H6">Benzene</option>
            <option value="C2H5OH">Ethanol</option>
            <option value="CO2">Carbon Dioxide</option>
            <option value="NH3">Ammonia</option>
            <option value="NaCl">Table Salt</option>
            <option value="HCl">Hydrochloric Acid</option>
            <option value="O2">Oxygen</option>
            <option value="C6H12O6">Glucose</option>
            <option value="C12H22O11">Sucrose (Sugar)</option>
            <option value="C">Diamond/Carbon</option>
            <option value="NaHCO3">Baking Soda</option>
            <option value="C10H14N2">Nicotine</option>
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

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: showBasics ? '1.2fr 1fr' : '1fr', 
        gap: '20px', 
        alignItems: 'start' 
      }}>
        {/* Left Side: 3D Viewer */}
        <div style={{ position: 'relative' }}>
          <div ref={viewerRef} style={{ width: '100%', height: showBasics ? '600px' : '500px', position: 'relative', border: '1px solid #eee', borderRadius: 12, background: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#475569' }}>
              <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
              Auto-rotate
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#475569' }}>
              <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
              Show labels
            </label>
            <button 
              onClick={() => { if (viewerInstance.current) { viewerInstance.current.zoomTo(); viewerInstance.current.render(); } }}
              style={{ padding: '2px 8px', borderRadius: 4, background: '#eee', border: '1px solid #ccc', cursor: 'pointer', fontSize: '12px' }}
            >
              Reset View
            </button>
          </div>
        </div>
        
        {/* Right Side: Educational Guide or Basic Info */}
        <div style={{ 
          padding: showBasics ? '16px' : '12px', 
          background: showBasics ? '#fff' : '#f7f7fb', 
          borderRadius: 12, 
          border: '1px solid #e2e8f0', 
          boxShadow: showBasics ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
          maxHeight: showBasics ? '660px' : 'auto',
          overflowY: showBasics ? 'auto' : 'visible'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#1e293b' }}>{molMetadata.title}</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Formula: <strong>{molMetadata.formula}</strong></div>
            </div>
            <button 
              onClick={() => setShowBasics(!showBasics)}
              style={{ 
                background: showBasics ? '#be185d' : '#fdf2f8', 
                color: showBasics ? 'white' : '#be185d',
                border: '1px solid #fbcfe8',
                borderRadius: '20px',
                padding: '6px 16px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              {showBasics ? 'Hide Basics' : 'Learn Basics'}
            </button>
          </div>
          
          {!showBasics ? (
            <>
              {molecule !== 'custom' && <div style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.5 }}>{MOLECULE_INFO[molecule]?.notes}</div>}
              
              {selectedAtom && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: '#0077b6' }}>Selected Atom</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: 13 }}>
                    <div>Element: <strong>{ELEMENT_INFO[selectedAtom.elem]?.name || selectedAtom.elem} ({selectedAtom.elem})</strong></div>
                    <div>Atomic No: <strong>{ELEMENT_INFO[selectedAtom.elem]?.atomicNumber ?? '—'}</strong></div>
                    <div style={{ gridColumn: 'span 2' }}>Position: <strong>({selectedAtom.x.toFixed(2)}, {selectedAtom.y.toFixed(2)}, {selectedAtom.z.toFixed(2)})</strong></div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="educational-guide">
              {/* Chemistry 101 Section */}
              <div className="basics-101-section" style={{ marginBottom: 20, padding: '12px 14px', background: '#f5f3ff', borderRadius: 10, border: '1px solid #ddd6fe' }}>
                <h4 style={{ color: '#5b21b6', fontSize: '1.05rem', marginTop: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>💡</span> Chemistry 101: The Basics
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {BASICS_101.map((item, idx) => (
                    <div key={idx} style={{ background: 'white', padding: 10, borderRadius: 8, border: '1px solid #e9e7ff' }}>
                      <div style={{ fontWeight: 'bold', color: '#6d28d9', fontSize: '0.85rem', marginBottom: 2 }}>{item.term} = {item.metaphor}</div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#4c1d95', lineHeight: 1.3 }}>{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {molecule !== 'custom' && MOLECULE_INFO[molecule] ? (
                <>
                  <div className="formation-section" style={{ marginBottom: 20 }}>
                    <h4 style={{ color: '#1e3a8a', fontSize: '1.05rem', marginBottom: 10, borderBottom: '2px solid #3b82f6', display: 'inline-block' }}>Building this Molecule:</h4>
                    <div className="formation-steps" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {MOLECULE_INFO[molecule].formation?.map(step => (
                        <div key={step.step} style={{ display: 'flex', gap: 12, background: 'white', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          <span style={{ background: '#3b82f6', color: 'white', minWidth: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>{step.step}</span>
                          <p style={{ margin: 0, fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.4 }}>{step.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="concepts-section">
                    <h4 style={{ color: '#1e3a8a', fontSize: '1.05rem', marginBottom: 10, borderBottom: '2px solid #3b82f6', display: 'inline-block' }}>Basic Terms:</h4>
                    <div className="concept-cards" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {MOLECULE_INFO[molecule].basicConcepts?.map((concept, idx) => (
                        <div key={idx} style={{ background: 'white', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          <h5 style={{ color: '#2563eb', margin: '0 0 6px 0', fontSize: '0.95rem' }}>{concept.term}</h5>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.3 }}>{concept.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: '#666', fontStyle: 'italic', padding: 12, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  Educational guide for this molecule is coming soon! Try selecting Water or Methane to see the basics.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoleculeAnimation;
