const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Experiment = require('./models/Experiment');
const User = require('./models/User'); // If needed for createdBy

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chemconcept', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

const experimentsToSeed = [
  // CLASS 8
  {
    title: 'Separation of Sand and Water (Filtration)',
    description: 'Learn how to separate an insoluble solid (sand) from a liquid (water) using filtration.',
    classLevel: 8,
    animation: 'filtration',
    apparatus: ['Funnel', 'Filter paper', 'Beaker x2', 'Stand'],
    steps: [
      'Place a funnel on a stand.',
      'Fold filter paper into a cone and place it inside the funnel.',
      'Put a beaker under the funnel.',
      'Pour the sand-water mixture slowly into the funnel.',
      'Water passes through the filter paper while sand remains.'
    ],
    expectedResult: 'Clear water is collected in the beaker (filtrate), and sand remains on the filter paper (residue).',
    safetyPrecautions: 'Handle glassware carefully.',
    principles: 'Filtration relies on particle size difference to separate components.',
    visibility: 'public'
  },
  {
    title: 'Sedimentation and Decantation',
    description: 'Separate heavy insoluble solids from liquids via settling.',
    classLevel: 8,
    animation: 'sedimentation',
    apparatus: ['Beaker x2', 'Glass rod'],
    steps: [
      'Mix soil with water in a beaker.',
      'Allow the mixture to stand undisturbed.',
      'Soil settles at the bottom.',
      'Slowly pour the clear water into another beaker.'
    ],
    expectedResult: 'Soil is left at the bottom of the first beaker, and relatively clearer water is transferred to the second.',
    safetyPrecautions: 'Pour slowly to avoid disturbing the sediment.',
    principles: 'Gravity causes heavier solid particles to settle down over time.',
    visibility: 'public'
  },
  {
    title: 'Evaporation to Obtain Salt',
    description: 'Recover dissolved salt from a aqueous solution by evaporating the solvent.',
    classLevel: 8,
    animation: 'evaporation',
    apparatus: ['China dish', 'Bunsen burner', 'Wire gauze', 'Tripod stand'],
    steps: [
      'Take salt solution in a china dish.',
      'Heat the solution gently.',
      'Continue heating until water evaporates.',
      'Solid salt remains.'
    ],
    expectedResult: 'White crystalline solid (salt) is left behind in the dish.',
    safetyPrecautions: 'Do not touch hot apparatus. Turn off burner when almost dry to avoid splattering.',
    principles: 'Evaporation vaporizes the liquid solvent, leaving the solid solute behind.',
    visibility: 'public'
  },
  {
    title: 'Crystallization of Sugar',
    description: 'Grow sugar crystals from a supersaturated solution.',
    classLevel: 8,
    animation: 'crystallization',
    apparatus: ['Beaker', 'Bunsen burner', 'Glass rod', 'Sugar', 'Water'],
    steps: [
      'Prepare concentrated sugar solution by heating water and sugar.',
      'Pour solution into a beaker.',
      'Allow the solution to cool slowly.',
      'Crystals form after some time.'
    ],
    expectedResult: 'Large, well-defined sugar crystals are formed.',
    safetyPrecautions: 'Handle hot syrup carefully to avoid severe burns.',
    principles: 'Solubility decreases as temperature drops, causing excess solute to crystallize.',
    visibility: 'public'
  },
  {
    title: 'Burning of Substances',
    description: 'Observe the flammability of different materials.',
    classLevel: 8,
    animation: 'combustion',
    apparatus: ['Burner', 'Tongs', 'Paper', 'Wood splint', 'Plastic strip'],
    steps: [
      'Take small samples of paper, wood, and plastic.',
      'Burn them carefully using a burner.',
      'Observe whether they burn or melt.',
      'Record observations.'
    ],
    expectedResult: 'Paper and wood burn producing ash and smoke. Plastic may melt and drip while burning.',
    safetyPrecautions: 'Perform in a well-ventilated area. Use tongs. Keep a fire extinguisher nearby.',
    principles: 'Different materials have different ignition temperatures and combustion properties.',
    visibility: 'public'
  },
  {
    title: 'Rusting of Iron',
    description: 'Observe the corrosion process of iron in the presence of water and oxygen.',
    classLevel: 8,
    animation: 'rusting',
    apparatus: ['Test tube', 'Iron nail', 'Water'],
    steps: [
      'Place an iron nail in a test tube with water.',
      'Leave the test tube for several days.',
      'Observe the nail.'
    ],
    expectedResult: 'A reddish-brown flaky coating (rust) forms on the surface of the nail.',
    safetyPrecautions: 'Handle rusted nails carefully to avoid cuts.',
    principles: 'Rusting is an oxidation reaction forming hydrated iron(III) oxide.',
    visibility: 'public'
  },

  // CLASS 9
  {
    title: 'Preparation of True Solution',
    description: 'Prepare a homogenous mixture of salt and water.',
    classLevel: 9,
    animation: 'solution',
    apparatus: ['Beaker', 'Glass rod', 'Salt', 'Water'],
    steps: [
      'Take water in a beaker.',
      'Add common salt.',
      'Stir until completely dissolved.'
    ],
    expectedResult: 'A clear, transparent liquid forms. No particles are visible.',
    safetyPrecautions: 'None.',
    principles: 'Solute particles are smaller than 1nm and mix evenly with the solvent.',
    visibility: 'public'
  },
  {
    title: 'Preparation of Suspension',
    description: 'Prepare a heterogenous mixture of sand and water.',
    classLevel: 9,
    animation: 'suspension',
    apparatus: ['Beaker', 'Glass rod', 'Sand', 'Water'],
    steps: [
      'Add sand to water.',
      'Stir the mixture.',
      'Observe particles settling after some time.'
    ],
    expectedResult: 'Turbid mixture initially, but particles settle down when left undisturbed.',
    safetyPrecautions: 'None.',
    principles: 'Suspension particles are larger than 1000nm and settle due to gravity.',
    visibility: 'public'
  },
  {
    title: 'Preparation of Colloid',
    description: 'Prepare a colloidal starch sol.',
    classLevel: 9,
    animation: 'colloid',
    apparatus: ['Beaker', 'Burner', 'Starch', 'Water', 'Glass rod'],
    steps: [
      'Mix starch with water.',
      'Heat gently while stirring.',
      'A colloidal solution forms.'
    ],
    expectedResult: 'A translucent mixture forms that scatters light (Tyndall effect).',
    safetyPrecautions: 'Avoid boiling over.',
    principles: 'Colloidal particles are between 1nm and 1000nm and remain dispersed.',
    visibility: 'public'
  },
  {
    title: 'Separation by Sublimation',
    description: 'Separate a sublimable volatile component from a non-sublimable impurity.',
    classLevel: 9,
    animation: 'sublimation',
    apparatus: ['China dish', 'Funnel', 'Cotton plug', 'Burner', 'Tripod stand'],
    steps: [
      'Mix ammonium chloride and sand.',
      'Heat the mixture in a china dish covered with an inverted funnel.',
      'Ammonium chloride vapors deposit on funnel walls.'
    ],
    expectedResult: 'White solid sublimate (ammonium chloride) collects on the inner sides of the funnel.',
    safetyPrecautions: 'Use a cotton plug to trap vapors. Do not inhale vapors.',
    principles: 'Ammonium chloride transitions directly from solid to gas without becoming a liquid.',
    visibility: 'public'
  },
  {
    title: 'Crystallization of Copper Sulphate',
    description: 'Obtain pure copper sulphate crystals from an impure sample.',
    classLevel: 9,
    animation: 'crystallization',
    apparatus: ['Beaker', 'Funnel', 'Filter paper', 'Burner', 'Copper sulphate'],
    steps: [
      'Dissolve copper sulphate in hot water.',
      'Filter the solution.',
      'Heat until concentrated.',
      'Allow to cool.',
      'Blue crystals appear.'
    ],
    expectedResult: 'Triclinic blue crystals of pure copper sulphate form in the dish.',
    safetyPrecautions: 'Copper sulphate is toxic; wash hands after handling.',
    principles: 'Pure substances crystallize out of a saturated solution upon cooling.',
    visibility: 'public'
  },
  {
    title: 'Determination of Melting Point of Ice',
    description: 'Measure the exact temperature at which solid ice turns to liquid water.',
    classLevel: 9,
    animation: 'melting_point',
    apparatus: ['Beaker', 'Thermometer', 'Crushed ice', 'Glass rod'],
    steps: [
      'Place crushed ice in a beaker.',
      'Insert a thermometer.',
      'Observe the temperature at which ice melts.'
    ],
    expectedResult: 'The thermometer reading remains constant at 0°C (273.15 K) until all ice is melted.',
    safetyPrecautions: 'Handle glass thermometer gently.',
    principles: 'Heat supplied is used as latent heat of fusion without increasing temperature.',
    visibility: 'public'
  },
  {
    title: 'Determination of Boiling Point of Water',
    description: 'Measure the exact temperature at which liquid water turns to vapor vigorously.',
    classLevel: 9,
    animation: 'boiling_point',
    apparatus: ['Beaker', 'Thermometer', 'Burner', 'Water'],
    steps: [
      'Heat water in a beaker.',
      'Place thermometer in the water.',
      'Record the temperature when boiling starts.'
    ],
    expectedResult: 'The thermometer reading remains constant at 100°C (373.15 K) as water boils.',
    safetyPrecautions: 'Be careful of hot steam to prevent scalds.',
    principles: 'Heat supplied serves as latent heat of vaporization.',
    visibility: 'public'
  },

  // CLASS 10
  {
    title: 'Reaction Between Zinc and HCl',
    description: 'Observe the reaction of a reactive metal with dilute acid.',
    classLevel: 10,
    animation: 'reaction',
    apparatus: ['Test tube', 'Zinc granules', 'Dilute HCl'],
    steps: [
      'Place zinc granules in a test tube.',
      'Add dilute HCl.',
      'Observe formation of bubbles.'
    ],
    expectedResult: 'Effervescence occurs, and a gas (H2) is evolved that burns with a pop sound.',
    safetyPrecautions: 'Handle acids with care; wear safety goggles.',
    principles: 'Metals above hydrogen in the reactivity series displace hydrogen from dilute acids.',
    visibility: 'public'
  },
  {
    title: 'Reaction Between Sodium Carbonate and HCl',
    description: 'Test the gas evolved when metal carbonates react with acids.',
    classLevel: 10,
    animation: 'reaction',
    apparatus: ['Test tube', 'Delivery tube', 'Sodium carbonate', 'Dilute HCl', 'Limewater'],
    steps: [
      'Take sodium carbonate in a test tube.',
      'Add dilute HCl.',
      'Pass the gas produced into limewater.'
    ],
    expectedResult: 'Brisk effervescence of CO2 gas, which turns limewater milky.',
    safetyPrecautions: 'Use delivery tube securely. Do not splash acid.',
    principles: 'Carbonates react with acids to form salt, water, and carbon dioxide.',
    visibility: 'public'
  },
  {
    title: 'Displacement Reaction (Iron + Copper Sulphate)',
    description: 'Observe a more reactive metal displacing a less reactive one from its salt solution.',
    classLevel: 10,
    animation: 'displacement',
    apparatus: ['Test tube', 'Iron nail', 'Copper sulphate solution'],
    steps: [
      'Take copper sulphate solution in a test tube.',
      'Dip an iron nail into the solution.',
      'Leave it for some time.',
      'Observe color change.'
    ],
    expectedResult: 'The blue solution turns pale green, and a reddish-brown deposit of copper forms on the iron nail.',
    safetyPrecautions: 'None required.',
    principles: 'Iron is more reactive than copper and displaces it from copper sulphate.',
    visibility: 'public'
  },
  {
    title: 'Testing pH of Solutions',
    description: 'Determine the rough pH of given samples using universal indicator paper.',
    classLevel: 10,
    animation: 'ph_test',
    apparatus: ['Samples (lemon juice, soap, water)', 'pH paper', 'Glass rod'],
    steps: [
      'Take samples of lemon juice, soap solution, and water.',
      'Dip pH paper into each solution.',
      'Compare color with pH chart.'
    ],
    expectedResult: 'Lemon juice (acidic, red/orange), Water (neutral, green), Soap (basic, blue/purple).',
    safetyPrecautions: 'Use fresh indicator strips.',
    principles: 'Universal indicator contains a mixture of dyes that change color predictably across the pH scale.',
    visibility: 'public'
  },
  {
    title: 'Electrolysis of Water',
    description: 'Decompose water into hydrogen and oxygen gases using electricity.',
    classLevel: 10,
    animation: 'electrolysis',
    apparatus: ['Electrolysis apparatus / voltmeter', 'Battery', 'Dilute acid', 'Water'],
    steps: [
      'Fill electrolysis apparatus with water and dilute acid.',
      'Insert electrodes connected to battery.',
      'Pass electric current.',
      'Collect gases formed.'
    ],
    expectedResult: 'Gas collects at both electrodes; Volume of H2 (cathode) is twice the volume of O2 (anode).',
    safetyPrecautions: 'Ensure correct electrical connections. Avoid short circuits.',
    principles: 'Electrical energy drives the non-spontaneous decomposition of water.',
    visibility: 'public'
  },

  // CLASS 11
  {
    title: 'Cutting and Bending Glass Tubes',
    description: 'Basic laboratory skills for manipulating glass tubing.',
    classLevel: 11,
    animation: 'glassworking',
    apparatus: ['Glass tube', 'Triangular file', 'Bunsen burner'],
    steps: [
      'Mark the glass tube where it must be cut.',
      'Scratch with a file.',
      'Break carefully.',
      'Heat the tube and bend gently.'
    ],
    expectedResult: 'A cleanly cut and smoothly bent glass tube without constrictions.',
    safetyPrecautions: 'Fire-polish edges to prevent cuts. Ensure tube is cool before touching.',
    principles: 'Glass softens upon heating, allowing it to be bent into desired shapes.',
    visibility: 'public'
  },
  {
    title: 'Crystallization of Alum',
    description: 'Purify a double salt via crystallization.',
    classLevel: 11,
    animation: 'crystallization',
    apparatus: ['Beaker', 'Burner', 'Alum sample', 'Filter paper'],
    steps: [
      'Dissolve alum in hot water.',
      'Filter the solution.',
      'Heat to concentrate.',
      'Cool slowly to obtain crystals.'
    ],
    expectedResult: 'Octahedral, transparent crystals of potash alum are formed.',
    safetyPrecautions: 'Handle hot glassware safely.',
    principles: 'Different solubilities at high and low temperatures enable purification.',
    visibility: 'public'
  },
  {
    title: 'Determination of Melting Point of Organic Compound',
    description: 'Find the melting point to check purity.',
    classLevel: 11,
    animation: 'melting_point',
    apparatus: ['Capillary tube', 'Thermometer', 'Thiele tube / Melting point bath', 'Organic compound'],
    steps: [
      'Fill a capillary tube with compound.',
      'Attach to thermometer.',
      'Place in heating bath.',
      'Heat slowly and note melting temperature.'
    ],
    expectedResult: 'The solid melts completely within a narrow 1-2 degree temperature range.',
    safetyPrecautions: 'Heat slowly near the melting point. Use safety glasses.',
    principles: 'Pure compounds melt sharply, while impurities broaden and lower the melting point.',
    visibility: 'public'
  },
  {
    title: 'Determination of Boiling Point of Liquid',
    description: 'Find the boiling point of a given organic liquid.',
    classLevel: 11,
    animation: 'boiling_point',
    apparatus: ['Boiling tube', 'Thermometer', 'Burner', 'Liquid sample', 'Capillary tube (sealed at one end)'],
    steps: [
      'Take liquid in a boiling tube.',
      'Insert thermometer.',
      'Heat slowly.',
      'Record temperature at boiling.'
    ],
    expectedResult: 'A steady stream of bubbles emerges, and the temperature remains constant.',
    safetyPrecautions: 'Do not heat highly flammable liquids with an open flame; use a water bath.',
    principles: 'Boiling occurs when vapor pressure equals atmospheric pressure.',
    visibility: 'public'
  },
  {
    title: 'Acid-Base Titration',
    description: 'Determine the concentration of an unknown acid or base.',
    classLevel: 11,
    animation: 'neutralization',
    apparatus: ['Burette', 'Pipette', 'Conical flask', 'Indicator', 'NaOH', 'HCl'],
    steps: [
      'Fill burette with NaOH solution.',
      'Pipette HCl into conical flask.',
      'Add indicator.',
      'Add NaOH slowly until color changes.',
      'Record volume.'
    ],
    expectedResult: 'A sharp, permanent color change occurs at the endpoint (e.g., colorless to pink with phenolphthalein).',
    safetyPrecautions: 'Use pipette filler; never pipeline by mouth.',
    principles: 'Neutralization quantitative analysis using stoichiometric ratios (M1V1=M2V2).',
    visibility: 'public'
  },
  {
    title: 'Qualitative Salt Analysis',
    description: 'Identify the cation and anion present in an inorganic salt.',
    classLevel: 11,
    animation: 'reaction',
    apparatus: ['Test tubes', 'Salt sample', 'Group reagents', 'Bunsen burner'],
    steps: [
      'Take a small quantity of unknown salt.',
      'Perform preliminary tests (color, flame test).',
      'Perform tests for anions using reagents.',
      'Perform tests for cations using group reagents.'
    ],
    expectedResult: 'Positive identification of one cation and one anion via systematic dry and wet tests.',
    safetyPrecautions: 'Handle concentrated acids safely. Perform inside a fume hood if toxic gases are evolved.',
    principles: 'Selective precipitation and characteristic reactions of inorganic ions.',
    visibility: 'public'
  },

  // CLASS 12
  {
    title: 'Preparation of Colloidal Solution',
    description: 'Prepare a lyophilic sol such as starch sol.',
    classLevel: 12,
    animation: 'colloid',
    apparatus: ['Beaker', 'Burner', 'Starch', 'Water'],
    steps: [
      'Prepare starch paste by heating starch with water.',
      'Cool the solution.',
      'Colloidal sol forms.'
    ],
    expectedResult: 'A stable, translucent sol is formed.',
    safetyPrecautions: 'Avoid charring the starch.',
    principles: 'Starch forms a lyophilic (solvent-loving) sol directly upon heating with water.',
    visibility: 'public'
  },
  {
    title: 'Chemical Kinetics Experiment',
    description: 'Study the effect of concentration on the rate of reaction between sodium thiosulphate and HCl.',
    classLevel: 12,
    animation: 'reaction',
    apparatus: ['Conical flask', 'Stopwatch', 'Paper with cross mark', 'Na2S2O3', 'HCl'],
    steps: [
      'Take sodium thiosulphate solution in flask.',
      'Add HCl.',
      'Place flask on paper with a cross mark.',
      'Measure time until the cross disappears.'
    ],
    expectedResult: 'The cross becomes invisible after some time due to sulphur precipitation. Time varies inversely with concentration.',
    safetyPrecautions: 'Avoid inhaling SO2 gas evolved.',
    principles: 'Higher concentration leads to more frequent collisions, increasing reaction rate.',
    visibility: 'public'
  },
  {
    title: 'Paper Chromatography',
    description: 'Separate pigments in ink or plant extracts.',
    classLevel: 12,
    animation: 'chromatography',
    apparatus: ['Chromatography paper', 'Capillary tube', 'Beaker', 'Solvent', 'Ink'],
    steps: [
      'Draw a pencil line on filter paper.',
      'Place ink spot on line.',
      'Suspend paper in solvent.',
      'Allow solvent to move upward.',
      'Different colors separate.'
    ],
    expectedResult: 'Ink separates into individual color bands traveling at different heights.',
    safetyPrecautions: 'Keep solvent fumes away from flames.',
    principles: 'Varying affinities of components for the mobile and stationary phases.',
    visibility: 'public'
  },
  {
    title: 'Preparation of Potash Alum',
    description: 'Synthesize potash alum (potassium aluminium sulphate) in the lab.',
    classLevel: 12,
    animation: 'crystallization',
    apparatus: ['Beaker', 'Filter paper', 'Burner', 'Aluminium chips', 'KOH', 'H2SO4'],
    steps: [
      'Dissolve aluminium in KOH solution.',
      'Filter the mixture.',
      'Add sulphuric acid.',
      'Heat and concentrate.',
      'Cool to obtain crystals.'
    ],
    expectedResult: 'Colorless octahedral crystals of potash alum.',
    safetyPrecautions: 'Reaction with KOH produces flammable H2 gas. Acid addition can be strongly exothermic.',
    principles: 'Preparation of a double salt from its constituent compounds.',
    visibility: 'public'
  },
  {
    title: 'Test for Carbohydrates',
    description: 'Identify the presence of reducing sugars.',
    classLevel: 12,
    animation: 'reaction',
    apparatus: ['Test tube', 'Burner', "Benedict's reagent", 'Food sample'],
    steps: [
      'Take food sample in test tube.',
      'Add Benedict’s solution.',
      'Heat the mixture.',
      'Observe color change.'
    ],
    expectedResult: 'Solution changes from blue to green, yellow, or brick-red precipitate depending on sugar concentration.',
    safetyPrecautions: 'Do not point heating test tube at anyone.',
    principles: 'Reducing sugars reduce Cu2+ ions to Cu+ forming Cu2O precipitate.',
    visibility: 'public'
  },
  {
    title: 'Test for Proteins',
    description: 'Identify the presence of proteins using the Biuret test.',
    classLevel: 12,
    animation: 'reaction',
    apparatus: ['Test tube', 'NaOH', 'Copper sulphate', 'Food sample (e.g., egg white)'],
    steps: [
      'Add NaOH to food sample.',
      'Add copper sulphate solution.',
      'Observe violet color.'
    ],
    expectedResult: 'A violet or purple color develops.',
    safetyPrecautions: 'NaOH is caustic; handle with care.',
    principles: 'Cu2+ ions form a purple coordination complex with peptide bonds in alkaline solution.',
    visibility: 'public'
  },
  {
    title: 'Test for Fats',
    description: 'Simple spot test for lipids.',
    classLevel: 12,
    animation: 'reaction',
    apparatus: ['Filter paper', 'Food sample (e.g., butter/oil)'],
    steps: [
      'Rub food sample on paper.',
      'Observe translucent spot.'
    ],
    expectedResult: 'A permanent translucent spot is left on the paper that does not dry out.',
    safetyPrecautions: 'None required.',
    principles: 'Lipids are non-volatile and reduce the scattering of light through the paper matrix.',
    visibility: 'public'
  }
];

const seedDB = async () => {
  try {
    let admin = await User.findOne({ email: 'admin@chemconcept.edu' });
    if (!admin) {
        admin = await User.findOne({ role: 'admin' });
    }
    
    // Optional: Only clear ones that have a classLevel 
    // Wait, let's just gently upsert based on title, so we don't wipe existing interactive titrations if any
    
    for (let exp of experimentsToSeed) {
      if (admin) {
         exp.createdBy = admin._id;
      }
      
      const existing = await Experiment.findOne({ title: exp.title });
      if (existing) {
        await Experiment.updateOne({ _id: existing._id }, { $set: exp });
        console.log(`Updated: ${exp.title}`);
      } else {
        await Experiment.create(exp);
        console.log(`Created: ${exp.title}`);
      }
    }
    
    console.log('Class 8-12 Experiments seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding experiments:', error);
    process.exit(1);
  }
};

seedDB();
