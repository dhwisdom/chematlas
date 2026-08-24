window.CHEM_CURRICULUM = {
  source: {
    institution: "University of Arkansas",
    catalog: "2026–27",
    program: "B.S. Chemistry — Biochemistry Concentration",
    note: "Degree spine based on the published eight-semester plan. Lesson/module breakdowns in this prototype are instructional design proposals rather than a copied course syllabus."
  },
  years: [
    {
      year: 1,
      label: "Foundations",
      semesters: [
        { term: "Fall", courses: [
          { code: "CHEM 12073/12071 or CHEM 14103/14101", name: "General Chemistry I + Lab", track: "chemistry", status: "active" },
          { code: "MATH 13004", name: "Precalculus Mathematics", track: "support" }
        ]},
        { term: "Spring", courses: [
          { code: "CHEM 12283/12281 or CHEM 14203/14201", name: "General Chemistry II + Lab", track: "chemistry" },
          { code: "MATH 24004", name: "Calculus I", track: "support" }
        ]}
      ]
    },
    {
      year: 2,
      label: "Measurement & Life Science",
      semesters: [
        { term: "Fall", courses: [
          { code: "CHEM 22673/22671", name: "Analytical Chemistry + Lab", track: "chemistry" },
          { code: "PHYS 20304", name: "University Physics I", track: "support" },
          { code: "BIOL 10103/10101", name: "Principles of Biology + Lab", track: "biology" }
        ]},
        { term: "Spring", courses: [
          { code: "PHYS 20404", name: "University Physics II", track: "support" },
          { code: "BIOL 25473/25471", name: "Cell Biology + Lab", track: "biology" }
        ]}
      ]
    },
    {
      year: 3,
      label: "Molecular Structure & Energy",
      semesters: [
        { term: "Fall", courses: [
          { code: "CHEM 37073/37072", name: "Organic Chemistry I + Lab", track: "chemistry" },
          { code: "CHEM 35004", name: "Physical Chemistry I", track: "chemistry" },
          { code: "BIOL 20003/20001", name: "General Microbiology + Lab", track: "biology" }
        ]},
        { term: "Spring", courses: [
          { code: "CHEM 37203/37202", name: "Organic Chemistry II + Lab", track: "chemistry" },
          { code: "CHEM 35204/35102", name: "Physical Chemistry II + Lab", track: "chemistry" }
        ]}
      ]
    },
    {
      year: 4,
      label: "Biochemistry & Instrumentation",
      semesters: [
        { term: "Fall", courses: [
          { code: "CHEM 38103", name: "Elements of Biochemistry", track: "biochemistry" },
          { code: "CHEM 47203", name: "Experimental Methods in Organic Chemistry", track: "chemistry" },
          { code: "BIOL 23373", name: "General Genetics", track: "biology" }
        ]},
        { term: "Spring", courses: [
          { code: "CHEM 48503", name: "Biochemical Techniques", track: "biochemistry" },
          { code: "CHEM 42203/42101", name: "Instrumental Analysis + Lab", track: "chemistry" }
        ]}
      ]
    }
  ],
  courses: [
    {
      id: "genchem1",
      code: "CHEM 12073 / 14103",
      name: "General Chemistry I",
      description: "Atomic structure, bonding, molecular geometry, stoichiometry and energy — the conceptual foundation for later chemistry.",
      completion: 18,
      modules: [
        { id: "measurement", title: "Matter, Measurement & Units", lessons: ["Scientific notation", "Dimensional analysis", "Significant figures"] },
        { id: "atomic", title: "Atomic Structure", lessons: ["Atoms and isotopes", "Light and spectra", "Quantum numbers", "Electron configuration"] },
        { id: "periodic", title: "Periodic Trends", lessons: ["Effective nuclear charge", "Atomic radius", "Ionization energy", "Electronegativity"] },
        { id: "bonding", title: "Chemical Bonding", lessons: ["Ionic vs covalent", "Lewis structures", "Formal charge", "Resonance"] },
        { id: "vsepr", title: "Molecular Geometry & VSEPR", lessons: ["Electron domains", "Molecular geometry", "Bond angles", "Polarity"], featured: true },
        { id: "stoich", title: "Stoichiometry", lessons: ["Moles", "Balanced equations", "Limiting reactants", "Percent yield"] },
        { id: "energy", title: "Thermochemistry", lessons: ["Heat and work", "Enthalpy", "Calorimetry", "Hess's law"] }
      ]
    },
    {
      id: "genchem2",
      code: "CHEM 12283 / 14203",
      name: "General Chemistry II",
      description: "Intermolecular forces, kinetics, equilibrium, acid–base chemistry, thermodynamics and electrochemistry.",
      completion: 0,
      modules: [
        { title: "Intermolecular Forces & Phases" }, { title: "Solutions" }, { title: "Chemical Kinetics" },
        { title: "Chemical Equilibrium" }, { title: "Acids, Bases & Buffers" }, { title: "Thermodynamics" }, { title: "Electrochemistry" }
      ]
    },
    {
      id: "organic1",
      code: "CHEM 37073",
      name: "Organic Chemistry I",
      description: "Structure, stereochemistry, conformations and mechanism-first organic chemistry.",
      completion: 12,
      modules: [
        { id: "org-structure", title: "Structure & Bonding", lessons: ["Hybridization revisited", "Line-angle structures", "Formal charge", "Resonance"] },
        { id: "org-functional", title: "Functional Groups", lessons: ["Hydrocarbons", "Alcohols and ethers", "Carbonyl families", "Amines"] },
        { id: "org-acidbase", title: "Acid–Base Chemistry", lessons: ["pKa reasoning", "Conjugate bases", "Induction", "Resonance stabilization"] },
        { id: "org-stereo", title: "Stereochemistry", lessons: ["Chirality", "CIP priorities", "R/S assignment", "Enantiomers and diastereomers"], featured: true },
        { id: "org-conformation", title: "Conformations", lessons: ["Newman projections", "Butane energy profile", "Cyclohexane chairs", "Axial vs equatorial"], featured: true },
        { id: "org-sn", title: "Substitution & Elimination", lessons: ["Curved arrows", "SN2", "SN1", "E2 and E1"], featured: true }
      ]
    },
    {
      id: "organic2",
      code: "CHEM 37203",
      name: "Organic Chemistry II",
      description: "Aromatic chemistry, carbonyl reactions, spectroscopy and multi-step synthesis built on mechanism patterns.",
      completion: 0,
      modules: [
        { title: "Aromaticity & Electrophilic Aromatic Substitution" }, { title: "Alcohol Oxidation & Reduction" },
        { title: "Aldehydes & Ketones" }, { title: "Carboxylic Acid Derivatives" }, { title: "Enolates" },
        { title: "Amines" }, { title: "IR & NMR Spectroscopy" }, { title: "Multi-step Synthesis" }
      ]
    },
    {
      id: "biochem",
      code: "CHEM 38103",
      name: "Elements of Biochemistry",
      description: "Structure–function relationships, enzymes, bioenergetics, metabolism and information flow.",
      completion: 0,
      modules: [
        { title: "Water, pH & Buffers" }, { title: "Amino Acids & Proteins" }, { title: "Enzyme Kinetics" },
        { title: "Carbohydrate Metabolism" }, { title: "Krebs Cycle" }, { title: "Electron Transport & ATP Synthesis" },
        { title: "Lipid Metabolism" }, { title: "DNA, RNA & Protein Synthesis" }
      ]
    }
  ],
  molecules: {
    ch4: {
      name: "Methane", formula: "CH₄", domains: "4 bonding / 0 lone pairs", geometry: "Tetrahedral", angle: "109.5°", hybridization: "sp³", polarity: "Nonpolar",
      why: "Four electron domains minimize repulsion by pointing toward the corners of a tetrahedron. The identical C–H bond dipoles cancel by symmetry.",
      xyz: `5\nMethane\nC 0.000 0.000 0.000\nH 0.629 0.629 0.629\nH -0.629 -0.629 0.629\nH -0.629 0.629 -0.629\nH 0.629 -0.629 -0.629`
    },
    nh3: {
      name: "Ammonia", formula: "NH₃", domains: "3 bonding / 1 lone pair", geometry: "Trigonal pyramidal", angle: "≈107°", hybridization: "sp³", polarity: "Polar",
      why: "The lone pair occupies more space than a bonding pair, compressing the H–N–H angles below the ideal tetrahedral angle. The bond dipoles do not cancel.",
      xyz: `4\nAmmonia\nN 0.000 0.000 0.120\nH 0.940 0.000 -0.250\nH -0.470 0.814 -0.250\nH -0.470 -0.814 -0.250`
    },
    h2o: {
      name: "Water", formula: "H₂O", domains: "2 bonding / 2 lone pairs", geometry: "Bent", angle: "104.5°", hybridization: "sp³", polarity: "Polar",
      why: "Two lone pairs repel more strongly than bonding pairs, compressing the H–O–H angle. Because the molecule is bent, its O–H dipoles add to a net molecular dipole.",
      xyz: `3\nWater\nO 0.000 0.000 0.000\nH 0.758 0.000 0.504\nH -0.758 0.000 0.504`
    },
    co2: {
      name: "Carbon dioxide", formula: "CO₂", domains: "2 bonding domains / 0 lone pairs", geometry: "Linear", angle: "180°", hybridization: "sp", polarity: "Nonpolar",
      why: "Two electron domains arrange opposite one another. Each C=O bond is polar, but the equal and opposite dipoles cancel in the linear molecule.",
      xyz: `3\nCarbon dioxide\nO -1.160 0.000 0.000\nC 0.000 0.000 0.000\nO 1.160 0.000 0.000`
    },
    bf3: {
      name: "Boron trifluoride", formula: "BF₃", domains: "3 bonding / 0 lone pairs", geometry: "Trigonal planar", angle: "120°", hybridization: "sp²", polarity: "Nonpolar",
      why: "Three electron domains maximize separation in one plane at 120°. The three strong B–F bond dipoles cancel because of trigonal planar symmetry.",
      xyz: `4\nBoron trifluoride\nB 0.000 0.000 0.000\nF 1.300 0.000 0.000\nF -0.650 1.126 0.000\nF -0.650 -1.126 0.000`
    },
    pcl5: {
      name: "Phosphorus pentachloride", formula: "PCl₅", domains: "5 bonding / 0 lone pairs", geometry: "Trigonal bipyramidal", angle: "90°, 120°, 180°", hybridization: "sp³d (intro model)", polarity: "Nonpolar",
      why: "Five domains separate into three equatorial positions and two axial positions. In the ideal gas-phase geometry, the P–Cl bond dipoles cancel by symmetry.",
      xyz: `6\nPhosphorus pentachloride\nP 0.000 0.000 0.000\nCl 2.000 0.000 0.000\nCl -1.000 1.732 0.000\nCl -1.000 -1.732 0.000\nCl 0.000 0.000 2.100\nCl 0.000 0.000 -2.100`
    },
    sf6: {
      name: "Sulfur hexafluoride", formula: "SF₆", domains: "6 bonding / 0 lone pairs", geometry: "Octahedral", angle: "90°, 180°", hybridization: "sp³d² (intro model)", polarity: "Nonpolar",
      why: "Six bonding domains point along three perpendicular axes. The highly polar S–F bonds cancel because every bond has an opposite partner.",
      xyz: `7\nSulfur hexafluoride\nS 0.000 0.000 0.000\nF 1.560 0.000 0.000\nF -1.560 0.000 0.000\nF 0.000 1.560 0.000\nF 0.000 -1.560 0.000\nF 0.000 0.000 1.560\nF 0.000 0.000 -1.560`
    }
  }
};
