
import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './MoleculeAnimation.css';

// Extensive molecule database
const MOLECULES = [
  {
    name: 'Water',
    formula: 'H₂O',
    searchTerms: ['water', 'h2o', 'dihydrogen monoxide'],
    atoms: [
      { element: 'O', x: 0, y: 0, z: 0, color: '#FF0000' },
      { element: 'H', x: -0.8, y: -0.5, z: 0, color: '#FFFFFF' },
      { element: 'H', x: 0.8, y: -0.5, z: 0, color: '#FFFFFF' }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 }
    ],
    description: 'A polar molecule with bent geometry. Essential for life.',
    properties: ['Polar', 'Bent geometry', 'Hydrogen bonding'],
    formation: [
      { step: 1, text: 'Oxygen atom has 6 valence electrons and needs 2 more.' },
      { step: 2, text: 'Two Hydrogen atoms each have 1 electron.' },
      { step: 3, text: 'Oxygen shares one electron with each Hydrogen, forming two covalent bonds.' }
    ],
    basicConcepts: [
      { term: 'Polarity', explanation: 'Oxygen pulls electrons more strongly than Hydrogen, creating a slight charge.' },
      { term: 'Covalent Bond', explanation: 'A bond formed when two atoms share electrons.' }
    ]
  },
  {
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    searchTerms: ['carbon dioxide', 'co2', 'dry ice'],
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0, color: '#808080' },
      { element: 'O', x: 1.2, y: 0, z: 0, color: '#FF0000' },
      { element: 'O', x: -1.2, y: 0, z: 0, color: '#FF0000' }
    ],
    bonds: [
      { from: 0, to: 1, double: true },
      { from: 0, to: 2, double: true }
    ],
    description: 'Linear molecule, greenhouse gas, product of combustion.',
    properties: ['Linear geometry', 'Non-polar', 'Greenhouse gas'],
    formation: [
      { step: 1, text: 'Carbon needs 4 more electrons to be stable.' },
      { step: 2, text: 'Each Oxygen needs 2 more electrons.' },
      { step: 3, text: 'Carbon forms TWO double bonds, sharing 4 electrons with each Oxygen.' }
    ],
    basicConcepts: [
      { term: 'Double Bond', explanation: 'When atoms share four electrons instead of two.' },
      { term: 'Linear Geometry', explanation: 'The atoms are arranged in a straight line.' }
    ]
  },
  {
    name: 'Methane',
    formula: 'CH₄',
    searchTerms: ['methane', 'ch4', 'natural gas'],
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0, color: '#808080' },
      { element: 'H', x: 0.6, y: 0.6, z: 0.6, color: '#FFFFFF' },
      { element: 'H', x: -0.6, y: -0.6, z: 0.6, color: '#FFFFFF' },
      { element: 'H', x: 0.6, y: -0.6, z: -0.6, color: '#FFFFFF' },
      { element: 'H', x: -0.6, y: 0.6, z: -0.6, color: '#FFFFFF' }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 0, to: 4 }
    ],
    description: 'Tetrahedral geometry, simplest alkane, natural gas component.',
    properties: ['Tetrahedral', 'Non-polar', 'Alkane'],
    formation: [
      { step: 1, text: 'Carbon has 4 valence electrons.' },
      { step: 2, text: 'Four Hydrogen atoms each provide 1 electron.' },
      { step: 3, text: 'Carbon shares its 4 electrons with 4 Hydogens to form a stable octet.' }
    ],
    basicConcepts: [
      { term: 'Tetrahedron', explanation: 'A 3D shape like a pyramid with a triangular base.' },
      { term: 'Valence Electrons', explanation: 'The electrons in the outermost shell of an atom.' }
    ]
  },
  {
    name: 'Ammonia',
    formula: 'NH₃',
    searchTerms: ['ammonia', 'nh3', 'nitrogen trihydride'],
    atoms: [
      { element: 'N', x: 0, y: 0, z: 0, color: '#3050F8' },
      { element: 'H', x: 0.5, y: 0.5, z: 0.5, color: '#FFFFFF' },
      { element: 'H', x: -0.5, y: 0.5, z: -0.5, color: '#FFFFFF' },
      { element: 'H', x: 0, y: -0.7, z: 0, color: '#FFFFFF' }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 }
    ],
    description: 'Trigonal pyramidal geometry, weak base, important in fertilizers.',
    properties: ['Trigonal pyramidal', 'Polar', 'Weak base'],
    formation: [
      { step: 1, text: 'Nitrogen has 5 valence electrons.' },
      { step: 2, text: 'Three Hydrogen atoms share 1 electron each with Nitrogen.' },
      { step: 3, text: 'One pair of electrons is left alone (Lone Pair), pushing the Hydrogens down.' }
    ],
    basicConcepts: [
      { term: 'Lone Pair', explanation: 'A pair of valence electrons that are NOT shared with another atom.' },
      { term: 'Trigonal Pyramidal', explanation: 'A pyramid shape with a triangular base.' }
    ]
  },
  {
    name: 'Ethanol',
    formula: 'C₂H₆O',
    searchTerms: ['ethanol', 'c2h6o', 'alcohol', 'ethyl alcohol'],
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0, color: '#808080' },
      { element: 'C', x: 1.2, y: 0, z: 0, color: '#808080' },
      { element: 'O', x: 2.2, y: 0.8, z: 0, color: '#FF0000' },
      { element: 'H', x: -0.4, y: 1, z: 0, color: '#FFFFFF' },
      { element: 'H', x: -0.4, y: -0.5, z: 0.9, color: '#FFFFFF' },
      { element: 'H', x: -0.4, y: -0.5, z: -0.9, color: '#FFFFFF' },
      { element: 'H', x: 1.6, y: -1, z: 0, color: '#FFFFFF' },
      { element: 'H', x: 1.6, y: 0.5, z: -0.9, color: '#FFFFFF' },
      { element: 'H', x: 2.8, y: 0.3, z: 0.5, color: '#FFFFFF' }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 0, to: 3 },
      { from: 0, to: 4 },
      { from: 0, to: 5 },
      { from: 1, to: 6 },
      { from: 1, to: 7 },
      { from: 2, to: 8 }
    ],
    description: 'Alcohol with hydroxyl group, used in beverages and fuel.',
    properties: ['Alcohol', 'Polar', 'Hydroxyl group'],
    formation: [
      { step: 1, text: 'Two carbons bond together.' },
      { step: 2, text: 'One carbon bonds to 3 hydrogens.' },
      { step: 3, text: 'The other carbon bonds to 2 hydrogens and an Oxygen (with its own Hydrogen).' }
    ],
    basicConcepts: [
      { term: 'Hydroxyl Group', explanation: 'The -OH group that makes a molecule an alcohol.' }
    ]
  },
  {
    name: 'Benzene',
    formula: 'C₆H₆',
    searchTerms: ['benzene', 'c6h6', 'aromatic'],
    atoms: [
      { element: 'C', x: 0, y: 1.2, z: 0, color: '#808080' },
      { element: 'C', x: 1.04, y: 0.6, z: 0, color: '#808080' },
      { element: 'C', x: 1.04, y: -0.6, z: 0, color: '#808080' },
      { element: 'C', x: 0, y: -1.2, z: 0, color: '#808080' },
      { element: 'C', x: -1.04, y: -0.6, z: 0, color: '#808080' },
      { element: 'C', x: -1.04, y: 0.6, z: 0, color: '#808080' },
      { element: 'H', x: 0, y: 2.1, z: 0, color: '#FFFFFF' },
      { element: 'H', x: 1.82, y: 1.05, z: 0, color: '#FFFFFF' },
      { element: 'H', x: 1.82, y: -1.05, z: 0, color: '#FFFFFF' },
      { element: 'H', x: 0, y: -2.1, z: 0, color: '#FFFFFF' },
      { element: 'H', x: -1.82, y: -1.05, z: 0, color: '#FFFFFF' },
      { element: 'H', x: -1.82, y: 1.05, z: 0, color: '#FFFFFF' }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 0 },
      { from: 0, to: 6 },
      { from: 1, to: 7 },
      { from: 2, to: 8 },
      { from: 3, to: 9 },
      { from: 4, to: 10 },
      { from: 5, to: 11 }
    ],
    description: 'Aromatic hydrocarbon with a ring structure, found in many organic compounds.',
    properties: ['Aromatic', 'Planar', 'Resonance structure'],
    formation: [
      { step: 1, text: 'Six Carbon atoms form a perfect hexagonal ring.' },
      { step: 2, text: 'Each Carbon shares electrons with two neighbors and one Hydrogen.' },
      { step: 3, text: 'Special "Resonance" means electrons flow freely around the ring.' }
    ],
    basicConcepts: [
      { term: 'Aromatic Ring', explanation: 'A stable circular arrangement of atoms with shared electrons.' },
      { term: 'Planar', explanation: 'All atoms lie in the same flat plane (2D).' }
    ]
  },
  {
    name: 'Hydrogen',
    formula: 'H₂',
    searchTerms: ['hydrogen', 'h2', 'dihydrogen'],
    atoms: [
      { element: 'H', x: -0.3, y: 0, z: 0, color: '#FFFFFF' },
      { element: 'H', x: 0.3, y: 0, z: 0, color: '#FFFFFF' }
    ],
    bonds: [
      { from: 0, to: 1 }
    ],
    description: 'Diatomic gas, simplest molecule, most abundant element in universe.',
    properties: ['Diatomic', 'Non-polar', 'Combustible'],
    formation: [
      { step: 1, text: 'Each Hydrogen atom has 1 single electron.' },
      { step: 2, text: 'Two Hydrogen atoms move close together.' },
      { step: 3, text: 'They share their electrons to form a single covalent bond.' }
    ],
    basicConcepts: [
      { term: 'Diatomic', explanation: 'A molecule consisting of two atoms of the same element.' },
      { term: 'Single Bond', explanation: 'A bond where two atoms share ONE pair of electrons.' }
    ]
  },
  {
    name: 'Oxygen',
    formula: 'O₂',
    searchTerms: ['oxygen', 'o2', 'dioxygen'],
    atoms: [
      { element: 'O', x: -0.4, y: 0, z: 0, color: '#FF0000' },
      { element: 'O', x: 0.4, y: 0, z: 0, color: '#FF0000' }
    ],
    bonds: [
      { from: 0, to: 1, double: true }
    ],
    description: 'Diatomic gas essential for aerobic respiration.',
    properties: ['Diatomic', 'Non-polar', 'Essential for life'],
    formation: [
      { step: 1, text: 'Oxygen atoms have 6 valence electrons each.' },
      { step: 2, text: 'They need 2 more electrons to reach a stable state of 8.' },
      { step: 3, text: 'They share TWO pairs of electrons, forming a double bond.' }
    ],
    basicConcepts: [
      { term: 'Double Bond', explanation: 'A covalent bond involving four shared electrons.' }
    ]
  },
  {
    name: 'Nitrogen',
    formula: 'N₂',
    searchTerms: ['nitrogen', 'n2', 'dinitrogen'],
    atoms: [
      { element: 'N', x: -0.4, y: 0, z: 0, color: '#3050F8' },
      { element: 'N', x: 0.4, y: 0, z: 0, color: '#3050F8' }
    ],
    bonds: [
      { from: 0, to: 1, triple: true }
    ],
    description: 'Diatomic gas, makes up 78% of atmosphere.',
    properties: ['Diatomic', 'Non-polar', 'Triple bond'],
    formation: [
      { step: 1, text: 'Nitrogen atoms have 5 valence electrons.' },
      { step: 2, text: 'They need 3 more electrons for stability.' },
      { step: 3, text: 'They share THREE pairs of electrons, creating an extremely strong triple bond.' }
    ],
    basicConcepts: [
      { term: 'Triple Bond', explanation: 'The strongest type of covalent bond, sharing six electrons.' }
    ]
  },
  {
    name: 'Chlorine',
    formula: 'Cl₂',
    searchTerms: ['chlorine', 'cl2', 'dichlorine'],
    atoms: [
      { element: 'Cl', x: -0.4, y: 0, z: 0, color: '#90EE90' },
      { element: 'Cl', x: 0.4, y: 0, z: 0, color: '#90EE90' }
    ],
    bonds: [
      { from: 0, to: 1 }
    ],
    description: 'Diatomic gas, used in water disinfection.',
    properties: ['Diatomic', 'Non-polar', 'Toxic gas'],
    formation: [
      { step: 1, text: 'Chlorine atoms have 7 valence electrons.' },
      { step: 2, text: 'They only need 1 more electron to be complete.' },
      { step: 3, text: 'They share one electron pair to form a single bond.' }
    ],
    basicConcepts: [
      { term: 'Halogen', explanation: 'Elements in Group 17 that are highly reactive.' }
    ]
  },
  {
    name: 'Hydrogen Chloride',
    formula: 'HCl',
    searchTerms: ['hydrogen chloride', 'hcl', 'hydrochloric acid'],
    atoms: [
      { element: 'H', x: -0.3, y: 0, z: 0, color: '#FFFFFF' },
      { element: 'Cl', x: 0.5, y: 0, z: 0, color: '#90EE90' }
    ],
    bonds: [
      { from: 0, to: 1 }
    ],
    description: 'Polar gas, strong acid when dissolved in water.',
    properties: ['Polar', 'Acidic', 'Corrosive'],
    formation: [
      { step: 1, text: 'Hydrogen has 1 electron, Chlorine has 7.' },
      { step: 2, text: 'They share their electrons so both feel "full".' },
      { step: 3, text: 'Chlorine pulls the electrons closer to itself because it is more electronegative.' }
    ],
    basicConcepts: [
      { term: 'Electronegativity', explanation: 'The ability of an atom to attract shared electrons.' },
      { term: 'Polar Molecule', explanation: 'A molecule where charge is unevenly distributed.' }
    ]
  },
  {
    name: 'Acetylene',
    formula: 'C₂H₂',
    searchTerms: ['acetylene', 'c2h2', 'ethyne'],
    atoms: [
      { element: 'C', x: -0.3, y: 0, z: 0, color: '#808080' },
      { element: 'C', x: 0.3, y: 0, z: 0, color: '#808080' },
      { element: 'H', x: -0.9, y: 0.3, z: 0, color: '#FFFFFF' },
      { element: 'H', x: 0.9, y: 0.3, z: 0, color: '#FFFFFF' }
    ],
    bonds: [
      { from: 0, to: 1, triple: true },
      { from: 0, to: 2 },
      { from: 1, to: 3 }
    ],
    description: 'Unsaturated hydrocarbon with triple bond, used in welding.',
    properties: ['Alkyne', 'Combustible', 'Triple bond'],
    formation: [
      { step: 1, text: 'Two carbons form a strong triple bond.' },
      { step: 2, text: 'The remaining electron from each carbon bonds with a hydrogen.' },
      { step: 3, text: 'This creates a linear, highly energetic molecule.' }
    ],
    basicConcepts: [
      { term: 'Alkyne', explanation: 'A hydrocarbon containing at least one triple bond.' },
      { term: 'Unsaturated', explanation: 'A molecule that can still react to add more atoms.' }
    ]
  },
  {
    name: 'Ethane',
    formula: 'C₂H₆',
    searchTerms: ['ethane', 'c2h6'],
    atoms: [
      { element: 'C', x: -0.4, y: 0, z: 0, color: '#808080' },
      { element: 'C', x: 0.4, y: 0, z: 0, color: '#808080' },
      { element: 'H', x: -0.8, y: 0.5, z: 0.5, color: '#FFFFFF' },
      { element: 'H', x: -0.8, y: -0.5, z: 0.5, color: '#FFFFFF' },
      { element: 'H', x: -0.8, y: 0, z: -0.7, color: '#FFFFFF' },
      { element: 'H', x: 0.8, y: 0.5, z: 0.5, color: '#FFFFFF' },
      { element: 'H', x: 0.8, y: -0.5, z: 0.5, color: '#FFFFFF' },
      { element: 'H', x: 0.8, y: 0, z: -0.7, color: '#FFFFFF' }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 0, to: 4 },
      { from: 1, to: 5 },
      { from: 1, to: 6 },
      { from: 1, to: 7 }
    ],
    description: 'Simplest alkane with two carbon atoms.',
    properties: ['Alkane', 'Combustible', 'Gas'],
    formation: [
      { step: 1, text: 'Two carbon atoms share one electron pair (single bond).' },
      { step: 2, text: 'Each carbon then bonds with 3 hydrogens to complete its 4 bonds.' }
    ],
    basicConcepts: [
      { term: 'Saturated Hydrocarbon', explanation: 'A molecule where all carbon-carbon bonds are single bonds.' }
    ]
  },
  {
    name: 'Propane',
    formula: 'C₃H₈',
    searchTerms: ['propane', 'c3h8'],
    atoms: [
      { element: 'C', x: -0.6, y: 0, z: 0, color: '#808080' },
      { element: 'C', x: 0, y: 0, z: 0, color: '#808080' },
      { element: 'C', x: 0.6, y: 0, z: 0, color: '#808080' },
      { element: 'H', x: -0.8, y: 0.5, z: 0.5, color: '#FFFFFF' },
      { element: 'H', x: -0.8, y: -0.5, z: 0.5, color: '#FFFFFF' },
      { element: 'H', x: -0.8, y: 0, z: -0.7, color: '#FFFFFF' },
      { element: 'H', x: 0, y: 0.5, z: 0.5, color: '#FFFFFF' },
      { element: 'H', x: 0, y: -0.5, z: 0.5, color: '#FFFFFF' },
      { element: 'H', x: 0.8, y: 0.5, z: 0.5, color: '#FFFFFF' },
      { element: 'H', x: 0.8, y: -0.5, z: 0.5, color: '#FFFFFF' },
      { element: 'H', x: 0.8, y: 0, z: -0.7, color: '#FFFFFF' }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 0, to: 3 },
      { from: 0, to: 4 },
      { from: 0, to: 5 },
      { from: 1, to: 6 },
      { from: 1, to: 7 },
      { from: 2, to: 8 },
      { from: 2, to: 9 },
      { from: 2, to: 10 }
    ],
    description: 'Three-carbon alkane, used as fuel.',
    properties: ['Alkane', 'Combustible', 'Fuel'],
    formation: [
      { step: 1, text: 'Three carbons form a chain.' },
      { step: 2, text: 'Carbon atoms at the ends bond to 3 hydrogens.' },
      { step: 3, text: 'The middle carbon bonds to 2 hydrogens.' }
    ],
    basicConcepts: [
      { term: 'Chain Structure', explanation: 'Atoms connected one after another in a line or sequence.' }
    ]
  },
  {
    name: 'Formaldehyde',
    formula: 'CH₂O',
    searchTerms: ['formaldehyde', 'ch2o', 'methanal'],
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0, color: '#808080' },
      { element: 'O', x: 0.8, y: 0.3, z: 0, color: '#FF0000' },
      { element: 'H', x: -0.4, y: 0.4, z: 0.5, color: '#FFFFFF' },
      { element: 'H', x: -0.4, y: 0.4, z: -0.5, color: '#FFFFFF' }
    ],
    bonds: [
      { from: 0, to: 1, double: true },
      { from: 0, to: 2 },
      { from: 0, to: 3 }
    ],
    description: 'Simple aldehyde, used in manufacturing and preservation.',
    properties: ['Aldehyde', 'Polar', 'Pungent odor'],
    formation: [
      { step: 1, text: 'Carbon forms a double bond with Oxygen.' },
      { step: 2, text: 'Carbon then forms two single bonds with Hydrogen atoms.' }
    ],
    basicConcepts: [
      { term: 'Carbonyl Group', explanation: 'A functional group composed of a carbon atom double-bonded to an oxygen atom.' }
    ]
  },
  {
    name: 'Acetic Acid',
    formula: 'C₂H₄O₂',
    searchTerms: ['acetic acid', 'c2h4o2', 'ethanoic acid', 'vinegar'],
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0, color: '#808080' },
      { element: 'C', x: 1.2, y: 0, z: 0, color: '#808080' },
      { element: 'O', x: 2.2, y: 0.8, z: 0, color: '#FF0000' },
      { element: 'O', x: 1.4, y: -1, z: 0, color: '#FF0000' },
      { element: 'H', x: -0.4, y: 0.9, z: 0.3, color: '#FFFFFF' },
      { element: 'H', x: -0.4, y: -0.5, z: 0.5, color: '#FFFFFF' },
      { element: 'H', x: -0.4, y: -0.4, z: -0.8, color: '#FFFFFF' },
      { element: 'H', x: 2.8, y: 0.3, z: 0.5, color: '#FFFFFF' }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 1, to: 2, double: true },
      { from: 1, to: 3 },
      { from: 3, to: 7 },
      { from: 0, to: 4 },
      { from: 0, to: 5 },
      { from: 0, to: 6 }
    ],
    description: 'Weak acid, main component of vinegar.',
    properties: ['Carboxylic acid', 'Weak acid', 'Organic acid'],
    formation: [
      { step: 1, text: 'Main Carbon-Carbon bond forms the backbone.' },
      { step: 2, text: 'One carbon is part of a methyl group (CH3).' },
      { step: 3, text: 'The other is a carboxyl group (COOH) with a double-bonded oxygen.' }
    ],
    basicConcepts: [
      { term: 'Carboxyl Group', explanation: 'The -COOH group that makes biological and organic acids.' }
    ]
  }
];

// Three.js-based molecule visualization component
const MoleculeAnimation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRotating, setIsRotating] = useState(true);
  const [viewStyle, setViewStyle] = useState('stick');
  const [displayMolecule, setDisplayMolecule] = useState(MOLECULES[0]);
  const [showBasics, setShowBasics] = useState(false);
  
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const moleculeGroupRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Filter molecules based on search query
  const filteredMolecules = MOLECULES.filter(mol => {
    const query = searchQuery.toLowerCase();
    if (!query) return false;
    return (
      mol.name.toLowerCase().includes(query) ||
      mol.formula.toLowerCase().includes(query) ||
      mol.searchTerms.some(term => term.includes(query))
    );
  });

  // Get current molecule
  const molecule = displayMolecule;

  // Get atom radius based on element and view style
  const getAtomRadius = (element, style) => {
    if (style === 'sphere') {
      return element === 'H' ? 0.15 : 0.25;
    } else if (style === 'ball_stick') {
      return element === 'H' ? 0.1 : 0.15;
    } else {
      return element === 'H' ? 0.05 : 0.08;
    }
  };

  // Build or rebuild the molecule in the scene
  const buildMolecule = () => {
    if (!moleculeGroupRef.current || !sceneRef.current) return;

    // Clear previous molecule
    while (moleculeGroupRef.current.children.length > 0) {
      const object = moleculeGroupRef.current.children[0];
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
      moleculeGroupRef.current.remove(object);
    }

    // Create atoms
    molecule.atoms.forEach((atom) => {
      const radius = getAtomRadius(atom.element, viewStyle);
      const segments = 32;
      const geometry = new THREE.SphereGeometry(radius, segments, segments);
      const material = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color(atom.color),
        shininess: 100
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(atom.x, atom.y, atom.z);
      moleculeGroupRef.current.add(sphere);

      // Add element label for all atoms - larger and more prominent
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext('2d');
      
      // Draw background circle
      context.fillStyle = 'rgba(255, 255, 255, 0.95)';
      context.beginPath();
      context.arc(64, 64, 55, 0, Math.PI * 2);
      context.fill();
      
      // Draw border
      context.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(64, 64, 55, 0, Math.PI * 2);
      context.stroke();
      
      // Draw text
      context.fillStyle = 'black';
      context.font = 'Bold 72px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(atom.element, 64, 64);
      
      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        sizeAttenuation: true
      });
      const sprite = new THREE.Sprite(labelMaterial);
      sprite.position.set(atom.x, atom.y, atom.z + 0.3);
      sprite.scale.set(0.8, 0.8, 0.8);
      sprite.renderOrder = 1;
      moleculeGroupRef.current.add(sprite);
    });

    // Create bonds
    molecule.bonds.forEach(bond => {
      const fromAtom = molecule.atoms[bond.from];
      const toAtom = molecule.atoms[bond.to];
      const start = new THREE.Vector3(fromAtom.x, fromAtom.y, fromAtom.z);
      const end = new THREE.Vector3(toAtom.x, toAtom.y, toAtom.z);
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      const bondRadius = viewStyle === 'stick' ? 0.06 : 0.03;
      const cylinderGeometry = new THREE.CylinderGeometry(bondRadius, bondRadius, length, 8);
      const cylinderMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
      
      const createBond = (offset = null) => {
        const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        cylinder.position.copy(start);
        cylinder.position.lerp(end, 0.5);
        if (offset) {
          cylinder.position.add(offset);
        }
        cylinder.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction.clone().normalize()
        );
        moleculeGroupRef.current.add(cylinder);
      };

      // Create main bond
      createBond();

      // Create additional bonds for double/triple bonds
      if (bond.double || bond.triple) {
        const perpendicular = new THREE.Vector3().crossVectors(
          direction.clone().normalize(),
          new THREE.Vector3(0, 0, 1)
        ).normalize();
        
        if (!perpendicular.length()) {
          perpendicular.set(1, 0, 0);
        }

        const offset = perpendicular.multiplyScalar(0.08);
        createBond(offset.clone());
        createBond(offset.clone().negate());
      }

      if (bond.triple) {
        const perpendicular2 = new THREE.Vector3().crossVectors(
          direction.clone().normalize(),
          new THREE.Vector3(0, 1, 0)
        ).normalize();
        
        const offset2 = perpendicular2.multiplyScalar(0.08);
        createBond(offset2);
      }
    });

    // Center the molecule
    moleculeGroupRef.current.position.set(0, 0, 0);
  };

  // Initialize Three.js scene
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Determine initial size with fallbacks (avoid zero-height/width)
    const rect = container.getBoundingClientRect();
    const initWidth = Math.max(1, Math.floor(rect.width || container.clientWidth || container.offsetWidth || 500));
    const initHeight = Math.max(1, Math.floor(rect.height || container.clientHeight || container.offsetHeight || 400));

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Create camera with safe aspect
    const camera = new THREE.PerspectiveCamera(
      75,
      initWidth / initHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(initWidth, initHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.rotateSpeed = 0.5;
    controlsRef.current = controls;
    controls.autoRotate = isRotating;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create molecule group
    const moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);
    moleculeGroupRef.current = moleculeGroup;

    // Add axes helper to ensure something is visible for debugging
    const axes = new THREE.AxesHelper(1.5);
    scene.add(axes);

    // Add a subtle grid to aid visibility
    const grid = new THREE.GridHelper(6, 12, 0x888888, 0xcccccc);
    grid.position.y = -2.5;
    scene.add(grid);

    // Handle window resize
    const handleResize = () => {
      const container = containerRef.current;
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width || container.clientWidth || container.offsetWidth || 500));
      const height = Math.max(1, Math.floor(rect.height || container.clientHeight || container.offsetHeight || 400));
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver to detect when container becomes visible
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && containerRef.current.clientWidth > 0 && containerRef.current.clientHeight > 0) {
        handleResize();
        // Force a re-render of the scene
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Animation loop
    const animate = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Build initial molecule once scene is ready
    buildMolecule();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      const container = containerRef.current;
      if (rendererRef.current && container && rendererRef.current.domElement.parentNode === container) {
        container.removeChild(rendererRef.current.domElement);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Handle auto-rotation
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isRotating;
    }
  }, [isRotating]);

  // Toggle rotation
  const toggleRotation = () => {
    setIsRotating(!isRotating);
    
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !isRotating;
    }
  };

  // Rebuild molecule when selection or view style changes
  useEffect(() => {
    buildMolecule();
  }, [displayMolecule, viewStyle]);

  return (
    <div className="molecule-animation">
      <div className="ma-header">
        <h2>3D Molecule Viewer</h2>
        <p>Explore interactive 3D molecular structures and learn chemistry basics</p>
      </div>
      
      <div className="ma-content">
        <div className="molecule-selector">
          <label htmlFor="mol-search">Search Molecules:</label>
          <input 
            id="mol-search"
            type="text"
            placeholder="Type molecule name or formula (e.g., 'water', 'H2O', 'CH4')..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="molecule-search-input"
          />
          {searchQuery && filteredMolecules.length > 0 && (
            <div className="search-results">
              {filteredMolecules.map((mol) => (
                <div 
                  key={mol.name}
                  className="search-result-item"
                  onClick={() => {
                    setDisplayMolecule(mol);
                    setSearchQuery('');
                  }}
                >
                  <span className="result-name">{mol.name}</span>
                  <span className="result-formula">{mol.formula}</span>
                </div>
              ))}
            </div>
          )}
          {searchQuery && filteredMolecules.length === 0 && (
            <div className="no-results">No molecules found. Try another search.</div>
          )}
        </div>

        <div className="molecule-display">
          <div className="molecule-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3>{molecule.name}</h3>
              <button 
                className={`basics-toggle-btn ${showBasics ? 'active' : ''}`}
                onClick={() => setShowBasics(!showBasics)}
              >
                {showBasics ? 'Hide Basics' : 'Learn Basics'}
              </button>
            </div>
            <div className="formula">{molecule.formula}</div>
            <p className="description">{molecule.description}</p>
            
            {!showBasics ? (
              <>
                <div className="properties">
                  <h4>Properties:</h4>
                  <div className="property-tags">
                    {molecule.properties.map((prop, idx) => (
                      <span key={idx} className="property-tag">{prop}</span>
                    ))}
                  </div>
                </div>
                
                <div className="view-controls">
                  <h4>View Controls:</h4>
                  <div className="control-buttons">
                    <button 
                      className={`view-btn ${viewStyle === 'stick' ? 'active' : ''}`}
                      onClick={() => setViewStyle('stick')}
                    >
                      Stick
                    </button>
                    <button 
                      className={`view-btn ${viewStyle === 'sphere' ? 'active' : ''}`}
                      onClick={() => setViewStyle('sphere')}
                    >
                      Space Fill
                    </button>
                    <button 
                      className={`view-btn ${viewStyle === 'ball_stick' ? 'active' : ''}`}
                      onClick={() => setViewStyle('ball_stick')}
                    >
                      Ball & Stick
                    </button>
                    <button 
                      className={`view-btn ${isRotating ? 'active' : ''}`}
                      onClick={toggleRotation}
                    >
                      {isRotating ? 'Stop Rotation' : 'Start Rotation'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="educational-guide">
                <div className="formation-section">
                  <h4>How it forms:</h4>
                  <div className="formation-steps">
                    {molecule.formation ? molecule.formation.map(step => (
                      <div key={step.step} className="formation-step">
                        <span className="step-number">{step.step}</span>
                        <p>{step.text}</p>
                      </div>
                    )) : <p>Detailed formation steps coming soon!</p>}
                  </div>
                </div>
                
                <div className="concepts-section">
                  <h4>Key Concepts:</h4>
                  <div className="concept-cards">
                    {molecule.basicConcepts ? molecule.basicConcepts.map((concept, idx) => (
                      <div key={idx} className="concept-card">
                        <h5>{concept.term}</h5>
                        <p>{concept.explanation}</p>
                      </div>
                    )) : <p>Fundamental concepts for this molecule coming soon!</p>}
                  </div>
                </div>
              </div>
            )}
            
            <div className="interaction-tip">
              <p><strong>Tip:</strong> Click and drag to rotate. Scroll to zoom.</p>
            </div>
          </div>

          <div 
            className="molecule-visualization" 
            ref={containerRef}
            style={{ width: '100%', height: '400px' }}
          >
            {/* Three.js will render here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoleculeAnimation;