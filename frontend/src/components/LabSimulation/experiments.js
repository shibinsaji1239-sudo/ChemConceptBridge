export const EXPERIMENTS = [
  {
    id: 'titration_acid_base',
    title: 'Standardization of HCl with NaOH',
    objective: 'Determine the exact molarity of an unknown HCl solution via titration.',
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
        instructions: 'Add 25mL of HCl (Analyte) to the Conical Flask.',
        validation: (items) => {
          const flask = items.find(i => i.id === 'flask');
          if (!flask) return false;
          const hcl = flask.contents?.find(c => c.id === 'hcl');
          return hcl && hcl.volume >= 25;
        }
      },
      {
        id: 'fill_burette',
        label: 'Titrant Preparation',
        instructions: 'Fill the Burette with 50mL of NaOH (Titrant).',
        validation: (items) => {
          const burette = items.find(i => i.id === 'burette');
          if (!burette) return false;
          const naoh = burette.contents?.find(c => c.id === 'naoh');
          return naoh && naoh.volume >= 45; // Close enough to 50
        }
      },
      {
        id: 'add_indicator',
        label: 'Indicator Selection',
        instructions: 'Add Phenolphthalein indicator to the Conical Flask to detect the endpoint.',
        validation: (items) => {
          const flask = items.find(i => i.id === 'flask');
          return flask && flask.contents?.some(c => c.id === 'phth');
        }
      },
      {
        id: 'titration_process',
        label: 'Precise Titration',
        instructions: 'Place the Burette above the Flask and "OPEN TAP" to add NaOH slowly. Stop immediately when the solution turns persistent light pink (pH ~8.2-10).',
        validation: (items) => {
          const flask = items.find(i => i.id === 'flask');
          return flask && flask.contents?.some(c => c.id === 'naoh') && flask.ph > 8.1;
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
