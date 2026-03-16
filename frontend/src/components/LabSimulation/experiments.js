export const EXPERIMENTS = [
  {
    id: 'titration_acid_base',
    title: 'Standardization of HCl with NaOH (Class 12 CBSE/Kerala)',
    objective: 'Determine the exact molarity of an unknown HCl solution via titration.',
    type: 'titration',
    phases: [
      {
        id: 'setup_vessel',
        label: 'Preparation',
        instructions: 'Prepare the reaction vessel: Drag a Conical Flask and a Burette to the workbench.',
        validation: (items) => items.some(i => i.id === 'flask') && items.some(i => i.id === 'burette')
      },
      {
        id: 'add_analyte',
        label: 'Analyte Addition',
        instructions: 'Add 20mL of unknown HCl (Analyte) to the Conical Flask.',
        validation: (items) => {
          const flask = items.find(i => i.id === 'flask');
          if (!flask) return false;
          const hcl = flask.contents?.find(c => c.id === 'hcl');
          return hcl && hcl.volume >= 20;
        }
      },
      {
        id: 'fill_burette',
        label: 'Titrant Preparation',
        instructions: 'Fill the Burette with 50mL of 0.1M NaOH (Titrant).',
        validation: (items) => {
          const burette = items.find(i => i.id === 'burette');
          if (!burette) return false;
          const naoh = burette.contents?.find(c => c.id === 'naoh');
          return naoh && naoh.volume >= 45;
        }
      },
      {
        id: 'add_indicator',
        label: 'Indicator Selection',
        instructions: 'Add 2 drops of Phenolphthalein indicator to the Conical Flask.',
        validation: (items) => {
          const flask = items.find(i => i.id === 'flask');
          return flask && flask.contents?.some(c => c.id === 'phth');
        }
      },
      {
        id: 'titration_process',
        label: 'Precise Titration',
        instructions: 'Place the Burette above the Flask and "OPEN TAP" to add NaOH slowly. Stop immediately when the solution turns persistent light pink.',
        validation: (items) => {
          const flask = items.find(i => i.id === 'flask');
          return flask && flask.contents?.some(c => c.id === 'naoh') && flask.ph > 8.1;
        }
      },
      {
        id: 'calculation',
        label: 'Calculation',
        instructions: 'Use the formula M1V1 = M2V2 to calculate the molarity of HCl.',
        isCalculation: true,
        formula: 'M(acid) = (M(base) * V(base)) / V(acid)',
        vars: { mBase: 0.1, vAcid: 20 }
      }
    ]
  },
  {
    id: 'na2co3_h2so4',
    title: 'Estimation of Na2CO3 using std H2SO4 (Class 12 CBSE)',
    objective: 'To estimate the strength of the given Sodium Carbonate solution using standard Sulphuric Acid.',
    type: 'titration',
    phases: [
      {
        id: 'setup',
        label: 'Setup',
        instructions: 'Drag a Conical Flask and a Burette to the workbench.',
        validation: (items) => items.some(i => i.id === 'flask') && items.some(i => i.id === 'burette')
      },
      {
        id: 'add_base',
        label: 'Base Prep',
        instructions: 'Add 20mL of Na2CO3 (Analyte) to the Conical Flask.',
        validation: (items) => {
          const flask = items.find(i => i.id === 'flask');
          return flask && flask.contents?.find(c => c.id === 'na2co3')?.volume >= 20;
        }
      },
      {
        id: 'fill_acid',
        label: 'Acid Prep',
        instructions: 'Fill the Burette with 50mL of 0.05M H2SO4.',
        validation: (items) => {
          const burette = items.find(i => i.id === 'burette');
          return burette && burette.contents?.find(c => c.id === 'h2so4')?.volume >= 45;
        }
      },
      {
        id: 'add_mo',
        label: 'Indicator',
        instructions: 'Add Methyl Orange indicator to the flask (turns yellow).',
        validation: (items) => {
          const flask = items.find(i => i.id === 'flask');
          return flask && flask.contents?.some(c => c.id === 'mo');
        }
      },
      {
        id: 'titrate',
        label: 'Titrate',
        instructions: 'Titrate until the yellow color turns orange-red.',
        validation: (items) => {
          const flask = items.find(i => i.id === 'flask');
          return flask && flask.ph < 4.5;
        }
      }
    ]
  },
  {
    id: 'precipitation_reaction',
    title: 'Qualitative Analysis: Silver Chloride',
    objective: 'Identify the formation of a precipitate in a double displacement reaction.',
    phases: [
      {
        id: 'prepare_beaker',
        label: 'Vessel Setup',
        instructions: 'Drag a Beaker to the center of the workbench.',
        validation: (items) => items.some(i => i.id === 'beaker')
      },
      {
        id: 'add_nacl',
        label: 'Reagent A',
        instructions: 'Add 50mL of NaCl (Sodium Chloride) solution.',
        validation: (items) => {
          const b = items.find(i => i.id === 'beaker');
          const nacl = b?.contents.find(c => c.id === 'nacl');
          return nacl && nacl.volume >= 50;
        }
      },
      {
        id: 'add_agno3',
        label: 'Reagent B',
        instructions: 'Add Silver Nitrate (AgNO₃) to observe the white precipitate formation.',
        validation: (items) => {
          const b = items.find(i => i.id === 'beaker');
          return b && b.contents.some(c => c.id === 'agno3');
        }
      }
    ]
  },
  {
    id: 'kinetic_thermal',
    title: 'Reaction Kinetics: Thermal Effects',
    objective: 'Study how heat affects water temperature and energy levels.',
    phases: [
      {
        id: 'setup_water',
        label: 'Solvent Prep',
        instructions: 'Add 50mL of Distilled Water to a Test Tube.',
        validation: (items) => {
          const t = items.find(i => i.id === 'test_tube');
          const w = t?.contents.find(c => c.id === 'h2o');
          return w && w.volume >= 50;
        }
      },
      {
        id: 'setup_heat',
        label: 'Thermal Setup',
        instructions: 'Place the Bunsen Burner under the Test Tube.',
        validation: (items) => {
          const t = items.find(i => i.id === 'test_tube');
          const b = items.find(i => i.id === 'burner');
          if (!t || !b) return false;
          return Math.abs(t.x - b.x) < 50 && Math.abs(t.y - b.y) < 100;
        }
      },
      {
        id: 'boil_water',
        label: 'Observation',
        instructions: 'Ignite the burner and heat the water until it reaches the boiling point (100°C).',
        validation: (items) => {
          const t = items.find(i => i.id === 'test_tube');
          return t && t.temp >= 99.5;
        }
      }
    ]
  }
];
