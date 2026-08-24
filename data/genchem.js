window.CHEM_GENCHEM = {
  "meta": {
    "title": "General Chemistry Foundations",
    "subtitle": "A two-semester, majors-level foundation for the rest of chemistry.",
    "scope": "ChemAtlas instructional sequence aligned to the University of Arkansas chemistry/biochemistry degree spine, UArk CHEM 12073/12071 context, ACS introductory-chemistry expectations, and the common two-semester general-chemistry scope reflected by OpenStax Chemistry 2e. This is not an official University of Arkansas syllabus.",
    "sources": [
      {
        "label": "University of Arkansas Chemistry & Biochemistry catalog",
        "url": "https://catalog.uark.edu/undergraduatecatalog/collegesandschools/jwilliamfulbrightcollegeofartsandsciences/chemistryandbiochemistrychbc/"
      },
      {
        "label": "ACS undergraduate coursework guidance",
        "url": "https://www.acs.org/education/policies/acs-approval-program/guidelines/coursework.html"
      },
      {
        "label": "OpenStax Chemistry 2e",
        "url": "https://openstax.org/details/books/chemistry-2e"
      }
    ]
  },
  "semesters": [
    {
      "number": 1,
      "title": "General Chemistry I",
      "code": "CHEM 12073 / 14103 pathway",
      "focus": "Measurement → particles → reactions → energy → electrons → structure → gases"
    },
    {
      "number": 2,
      "title": "General Chemistry II",
      "code": "CHEM 12283 / 14203 pathway",
      "focus": "Forces → solutions → rates → equilibrium → acids/bases → thermodynamics → electrochemistry"
    }
  ],
  "modules": [
    {
      "id": "measurement",
      "semester": 1,
      "number": 1,
      "title": "Measurement, Units & Chemical Reasoning",
      "subtitle": "How chemists turn observations into defensible numbers.",
      "prerequisite": "None",
      "outcomes": [
        "Distinguish qualitative observations from quantitative measurements",
        "Use SI units, metric prefixes and derived units",
        "Apply significant-figure rules without losing precision",
        "Use dimensional analysis to convert between units and connect quantities"
      ],
      "sections": [
        {
          "title": "Measurements are models of reality",
          "body": [
            "A measurement is never just a number. It contains a magnitude, a unit, and an implied level of certainty. Writing 12.0 mL communicates more information than writing 12 mL because the trailing zero indicates the measurement was resolved to the tenths place.",
            "Chemistry depends on comparing quantities across scales: picometers for bond lengths, grams for samples, liters for gases, and moles for particle counts. Units keep those quantities meaningful and allow equations to act as built-in error checks."
          ]
        },
        {
          "title": "Precision, accuracy and significant figures",
          "body": [
            "Accuracy asks how close a result is to an accepted or true value; precision asks how reproducible repeated measurements are. A set of measurements can be precise but systematically wrong, or accurate on average but imprecise.",
            "For multiplication and division, the result is limited by the factor with the fewest significant figures. For addition and subtraction, the result is limited by the least precise decimal place. Keep extra digits during intermediate steps and round once at the end."
          ]
        },
        {
          "title": "Dimensional analysis is chemistry’s universal translator",
          "body": [
            "A conversion factor is a ratio equal to one. Arrange conversion factors so unwanted units cancel algebraically. The same logic later drives stoichiometry: grams → moles → mole ratio → moles → grams is simply dimensional analysis using chemical relationships."
          ]
        }
      ],
      "equations": [
        {
          "label": "Density",
          "expression": "ρ = m / V"
        },
        {
          "label": "Percent error",
          "expression": "% error = |experimental − accepted| / accepted × 100%"
        }
      ],
      "example": {
        "prompt": "A liquid sample has a mass of 18.42 g and a volume of 15.0 mL. Find its density with appropriate significant figures.",
        "steps": [
          "Use ρ = m/V.",
          "18.42 g ÷ 15.0 mL = 1.228 g/mL.",
          "The volume has 3 significant figures, so report 3 significant figures."
        ],
        "answer": "1.23 g/mL"
      },
      "check": {
        "question": "Which result correctly reports 12.51 g ÷ 3.2 mL?",
        "choices": [
          "3.909 g/mL",
          "3.91 g/mL",
          "3.9 g/mL",
          "4 g/mL"
        ],
        "answer": 2,
        "explanation": "Division is limited by the factor with the fewest significant figures. 3.2 has two significant figures, so the result is 3.9 g/mL."
      },
      "bridge": {
        "course": "Every later chemistry course",
        "text": "Unit analysis is the error-checking language behind stoichiometry, kinetics, thermodynamics, spectroscopy, enzyme assays and analytical calibration."
      },
      "lab": "Connects directly to density, mass/volume measurement, uncertainty, graphing and laboratory notebook practice.",
      "tool": null,
      "vocabulary": [
        "SI unit",
        "derived unit",
        "precision",
        "accuracy",
        "significant figures",
        "dimensional analysis",
        "density"
      ]
    },
    {
      "id": "atoms-moles",
      "semester": 1,
      "number": 2,
      "title": "Atoms, Isotopes & the Mole",
      "subtitle": "Connecting submicroscopic particles to laboratory-scale matter.",
      "prerequisite": "Measurement & Units",
      "outcomes": [
        "Describe atoms using protons, neutrons and electrons",
        "Relate atomic number and mass number to isotope notation",
        "Calculate weighted-average atomic mass",
        "Use Avogadro’s constant to move between particles and moles"
      ],
      "sections": [
        {
          "title": "Atomic identity comes from proton count",
          "body": [
            "The atomic number Z is the number of protons in the nucleus and defines the element. Neutral atoms have equal numbers of protons and electrons; ions form when electrons are gained or lost.",
            "Isotopes are atoms of the same element with different numbers of neutrons. They therefore share chemical identity but differ in mass. A nuclide is commonly written with mass number A as a superscript and atomic number Z as a subscript."
          ]
        },
        {
          "title": "Average atomic mass is a weighted average",
          "body": [
            "The decimal atomic masses on the periodic table are not usually the mass of one particular atom. They represent the abundance-weighted average of naturally occurring isotopes. A rare heavy isotope contributes less to the average than a common light isotope."
          ]
        },
        {
          "title": "The mole bridges particles and grams",
          "body": [
            "Atoms and molecules are too small to count individually in the laboratory, so chemists count them by grouping 6.02214076 × 10²³ entities into one mole. Molar mass converts between the amount of substance in moles and measurable mass in grams.",
            "This bridge is foundational: nearly every quantitative reaction problem begins by converting a measured quantity into moles."
          ]
        }
      ],
      "equations": [
        {
          "label": "Avogadro constant",
          "expression": "Nₐ = 6.02214076 × 10²³ mol⁻¹"
        },
        {
          "label": "Moles from mass",
          "expression": "n = m / M"
        },
        {
          "label": "Weighted atomic mass",
          "expression": "average mass = Σ(fractional abundance × isotope mass)"
        }
      ],
      "example": {
        "prompt": "How many carbon atoms are present in 0.250 mol C?",
        "steps": [
          "Start from amount in moles.",
          "Multiply by Avogadro’s constant: 0.250 mol × 6.022 × 10²³ atoms/mol.",
          "Cancel mol and round to three significant figures."
        ],
        "answer": "1.51 × 10²³ carbon atoms"
      },
      "check": {
        "question": "An ion has 17 protons and 18 electrons. What is its charge?",
        "choices": [
          "+1",
          "0",
          "−1",
          "−17"
        ],
        "answer": 2,
        "explanation": "One more electron than protons gives a net charge of −1. An atom with 17 protons is chlorine, so the ion is Cl⁻."
      },
      "bridge": {
        "course": "Analytical chemistry & biochemistry",
        "text": "Moles make concentration, titration, reaction yield, enzyme assays and biomolecular preparation quantitatively possible."
      },
      "lab": "Supports mass-based composition experiments and the interpretation of hydrates and reaction stoichiometry.",
      "tool": null,
      "vocabulary": [
        "atomic number",
        "mass number",
        "isotope",
        "ion",
        "mole",
        "Avogadro constant",
        "molar mass"
      ]
    },
    {
      "id": "formulas",
      "semester": 1,
      "number": 3,
      "title": "Formulas, Nomenclature & Composition",
      "subtitle": "Learning to read and write the symbolic language of substances.",
      "prerequisite": "Atoms, Isotopes & the Mole",
      "outcomes": [
        "Differentiate molecular, empirical and structural formulas",
        "Name common ionic and molecular compounds",
        "Calculate formula mass and percent composition",
        "Determine empirical and molecular formulas from composition data"
      ],
      "sections": [
        {
          "title": "A chemical formula encodes composition",
          "body": [
            "An empirical formula gives the simplest whole-number atom ratio. A molecular formula gives the actual number of each atom in a molecule. Structural formulas add connectivity, which becomes crucial in organic chemistry because different structures can share the same molecular formula.",
            "For ionic compounds, the formula represents the lowest whole-number ratio of ions needed for electrical neutrality rather than a discrete molecule."
          ]
        },
        {
          "title": "Nomenclature communicates charge and composition",
          "body": [
            "For ionic compounds, name the cation first and the anion second. Transition-metal charges are often specified with Roman numerals because one metal can form several common cations. Molecular compounds between nonmetals use prefixes to communicate atom counts.",
            "Learning names is not only memorization: naming forces you to reason about charges, common ions and chemical families."
          ]
        },
        {
          "title": "Composition connects formulas to measurements",
          "body": [
            "Percent composition tells what fraction of a compound’s mass comes from each element. Combustion analysis and other composition measurements can be converted to moles of elements, simplified to whole-number ratios and used to infer an empirical formula."
          ]
        }
      ],
      "equations": [
        {
          "label": "Mass percent",
          "expression": "mass % element = mass element / mass compound × 100%"
        },
        {
          "label": "Molecular formula",
          "expression": "molecular formula = (empirical formula)ₙ"
        }
      ],
      "example": {
        "prompt": "A compound contains 40.0% C, 6.7% H and 53.3% O by mass. Find the empirical formula.",
        "steps": [
          "Assume 100 g: 40.0 g C, 6.7 g H, 53.3 g O.",
          "Convert each to moles: about 3.33 mol C, 6.65 mol H, 3.33 mol O.",
          "Divide by the smallest: C : H : O ≈ 1 : 2 : 1."
        ],
        "answer": "CH₂O"
      },
      "check": {
        "question": "What is the correct formula for aluminum oxide?",
        "choices": [
          "AlO",
          "Al₂O",
          "AlO₂",
          "Al₂O₃"
        ],
        "answer": 3,
        "explanation": "Al forms Al³⁺ and oxide is O²⁻. The lowest neutral combination is 2 Al³⁺ and 3 O²⁻, giving Al₂O₃."
      },
      "bridge": {
        "course": "Organic chemistry",
        "text": "Organic chemistry expands “formula” into connectivity and functional groups; the distinction between molecular and structural formula becomes central to isomerism."
      },
      "lab": "Connects to composition, waters of hydration, separations and identification of unknowns.",
      "tool": null,
      "vocabulary": [
        "empirical formula",
        "molecular formula",
        "formula unit",
        "percent composition",
        "polyatomic ion",
        "nomenclature"
      ]
    },
    {
      "id": "stoichiometry",
      "semester": 1,
      "number": 4,
      "title": "Chemical Reactions & Stoichiometry",
      "subtitle": "Using balanced equations as quantitative maps.",
      "prerequisite": "Formulas, Nomenclature & Composition",
      "outcomes": [
        "Balance chemical equations by conserving atoms",
        "Interpret coefficients as mole ratios",
        "Solve mass–mass and solution stoichiometry problems",
        "Identify limiting reactants and calculate theoretical and percent yield"
      ],
      "sections": [
        {
          "title": "Balanced equations express conservation of matter",
          "body": [
            "Chemical reactions rearrange atoms; they do not create or destroy them. Coefficients are adjusted until each element has the same atom count on both sides. Never change subscripts to balance an equation because that changes the identity of the substances.",
            "The coefficients are simultaneously particle ratios and mole ratios. For 2 H₂ + O₂ → 2 H₂O, two molecules or two moles of H₂ react with one of O₂ to form two of H₂O."
          ]
        },
        {
          "title": "The mole ratio is the reaction’s conversion factor",
          "body": [
            "Most stoichiometry problems follow the same architecture: convert the given quantity to moles, use the balanced-equation coefficient ratio, then convert to the desired unit. This is dimensional analysis with chemical meaning."
          ]
        },
        {
          "title": "The limiting reactant controls how far the reaction can proceed",
          "body": [
            "When reactants are not present in exact stoichiometric proportions, one is consumed first. That limiting reactant sets the maximum possible product, called theoretical yield. Actual yield is usually lower because reactions can be incomplete, side reactions can occur, or material can be lost during handling."
          ]
        }
      ],
      "equations": [
        {
          "label": "Percent yield",
          "expression": "% yield = actual yield / theoretical yield × 100%"
        },
        {
          "label": "Reaction conversion",
          "expression": "mol B = mol A × (coefficient B / coefficient A)"
        }
      ],
      "example": {
        "prompt": "2 H₂ + O₂ → 2 H₂O. If 5.00 mol H₂ reacts with 2.00 mol O₂, what limits the reaction and how many moles of water can form?",
        "steps": [
          "5.00 mol H₂ would require 2.50 mol O₂, but only 2.00 mol O₂ is available.",
          "Therefore O₂ is limiting.",
          "2.00 mol O₂ × (2 mol H₂O / 1 mol O₂) = 4.00 mol H₂O."
        ],
        "answer": "O₂ is limiting; theoretical yield = 4.00 mol H₂O"
      },
      "check": {
        "question": "In N₂ + 3H₂ → 2NH₃, how many moles NH₃ form from 6.0 mol H₂ if N₂ is excess?",
        "choices": [
          "2.0 mol",
          "4.0 mol",
          "6.0 mol",
          "12 mol"
        ],
        "answer": 1,
        "explanation": "6.0 mol H₂ × (2 mol NH₃ / 3 mol H₂) = 4.0 mol NH₃."
      },
      "bridge": {
        "course": "Every reaction-based course",
        "text": "Organic synthesis yield, enzyme turnovers, analytical titrations and metabolic mass balances all rely on conservation and stoichiometric relationships."
      },
      "lab": "Directly supports reaction-type experiments, gravimetric work, hydrates, limiting-reactant studies and percent-yield analysis.",
      "tool": null,
      "vocabulary": [
        "coefficient",
        "mole ratio",
        "limiting reactant",
        "excess reactant",
        "theoretical yield",
        "actual yield",
        "percent yield"
      ]
    },
    {
      "id": "aqueous",
      "semester": 1,
      "number": 5,
      "title": "Aqueous Reactions, Ions & Redox",
      "subtitle": "What changes when substances dissolve and react in water.",
      "prerequisite": "Chemical Reactions & Stoichiometry",
      "outcomes": [
        "Classify strong electrolytes, weak electrolytes and nonelectrolytes",
        "Use solubility patterns to predict precipitation",
        "Write complete and net ionic equations",
        "Assign oxidation numbers and recognize redox reactions"
      ],
      "sections": [
        {
          "title": "Dissolution can create mobile ions",
          "body": [
            "Strong electrolytes dissociate essentially completely into ions in water, making the solution electrically conductive. Weak electrolytes ionize only partially, while nonelectrolytes dissolve without generating appreciable ions.",
            "When writing ionic equations, strong soluble electrolytes are represented as separated ions. Solids, liquids, gases and weak electrolytes remain intact."
          ]
        },
        {
          "title": "Net ionic equations reveal the chemical event",
          "body": [
            "A precipitation reaction occurs when ions combine to form a sparingly soluble solid. Spectator ions appear unchanged on both sides of the complete ionic equation and are removed to obtain the net ionic equation.",
            "Acid–base neutralization can likewise be reduced to the core transfer process. For a strong acid and strong base, H⁺(aq) + OH⁻(aq) → H₂O(l)."
          ]
        },
        {
          "title": "Redox tracks electron transfer",
          "body": [
            "Oxidation is an increase in oxidation number and corresponds to loss of electrons; reduction is a decrease and corresponds to gain of electrons. Oxidizing agents are reduced, while reducing agents are oxidized. This vocabulary becomes the foundation of electrochemistry and the electron-transfer chains of biochemistry."
          ]
        }
      ],
      "equations": [
        {
          "label": "Molarity",
          "expression": "M = mol solute / L solution"
        },
        {
          "label": "Dilution",
          "expression": "M₁V₁ = M₂V₂"
        }
      ],
      "example": {
        "prompt": "Mix aqueous AgNO₃ and NaCl. Write the net ionic equation.",
        "steps": [
          "Both reactants are soluble strong electrolytes, so write them as ions.",
          "AgCl is insoluble and forms a solid; Na⁺ and NO₃⁻ remain aqueous.",
          "Cancel spectator ions."
        ],
        "answer": "Ag⁺(aq) + Cl⁻(aq) → AgCl(s)"
      },
      "check": {
        "question": "Which species is oxidized when Zn(s) reacts with Cu²⁺(aq) to form Zn²⁺ and Cu(s)?",
        "choices": [
          "Zn",
          "Cu²⁺",
          "Zn²⁺",
          "Cu"
        ],
        "answer": 0,
        "explanation": "Zn goes from oxidation state 0 to +2, an increase, so zinc is oxidized."
      },
      "bridge": {
        "course": "Analytical chemistry & biochemistry",
        "text": "Precipitation, acid–base and redox chemistry become titrations, separations, electrodes, cofactors and biological electron transfer."
      },
      "lab": "Connects to solubility, reaction classification, separations, conductivity and qualitative observations of precipitates.",
      "tool": null,
      "vocabulary": [
        "electrolyte",
        "spectator ion",
        "net ionic equation",
        "precipitate",
        "oxidation number",
        "oxidation",
        "reduction"
      ]
    },
    {
      "id": "thermochemistry",
      "semester": 1,
      "number": 6,
      "title": "Thermochemistry & Energy",
      "subtitle": "Tracking energy as reactions change matter.",
      "prerequisite": "Stoichiometry",
      "outcomes": [
        "Define system, surroundings, heat and work",
        "Use sign conventions for energy transfer",
        "Calculate heat with specific heat capacity",
        "Relate reaction enthalpy to stoichiometric amount and use Hess’s law"
      ],
      "sections": [
        {
          "title": "Energy bookkeeping begins with a boundary",
          "body": [
            "The system is the part of the universe chosen for study; everything else is the surroundings. Heat q is energy transferred because of a temperature difference, while work w is energy transferred by other organized processes such as expansion against pressure.",
            "Using the chemistry sign convention, heat entering the system is positive and heat leaving is negative. Work done on the system is positive; work done by the system is negative."
          ]
        },
        {
          "title": "Enthalpy is useful at constant pressure",
          "body": [
            "For many reactions carried out open to the atmosphere, the heat transferred at constant pressure equals the enthalpy change ΔH. An exothermic process has ΔH < 0 and releases heat; an endothermic process has ΔH > 0 and absorbs heat.",
            "Because enthalpy is a state function, the overall ΔH depends only on initial and final states. Hess’s law lets us add known reactions and their enthalpies to construct a target reaction."
          ]
        },
        {
          "title": "Calorimetry converts temperature change into heat",
          "body": [
            "If no phase change or reaction occurs within the measured material, q = mcΔT relates heat to mass, specific heat capacity and temperature change. In an insulated calorimeter, heat lost by one part is approximately heat gained by another."
          ]
        }
      ],
      "equations": [
        {
          "label": "First law",
          "expression": "ΔE = q + w"
        },
        {
          "label": "Sensible heat",
          "expression": "q = mcΔT"
        },
        {
          "label": "Reaction heat",
          "expression": "qₚ = ΔH at constant pressure"
        }
      ],
      "example": {
        "prompt": "How much heat is needed to warm 100.0 g water from 22.0 °C to 35.0 °C? Use c = 4.184 J g⁻¹ °C⁻¹.",
        "steps": [
          "ΔT = 35.0 − 22.0 = 13.0 °C.",
          "q = (100.0 g)(4.184 J g⁻¹ °C⁻¹)(13.0 °C).",
          "Round to three significant figures."
        ],
        "answer": "5.44 × 10³ J = 5.44 kJ absorbed"
      },
      "check": {
        "question": "A reaction has ΔH = −125 kJ mol⁻¹. Which statement is correct?",
        "choices": [
          "It is endothermic",
          "It releases heat to the surroundings",
          "The products must be hotter",
          "Entropy must decrease"
        ],
        "answer": 1,
        "explanation": "Negative ΔH means the system releases heat at constant pressure; the process is exothermic."
      },
      "bridge": {
        "course": "Physical chemistry & metabolism",
        "text": "Thermodynamics later separates enthalpy, entropy and free energy; biochemistry uses the same bookkeeping for ATP hydrolysis and coupled reactions."
      },
      "lab": "Connects to energy measurements, calorimetry, hydration/dehydration and careful temperature data interpretation.",
      "tool": null,
      "vocabulary": [
        "system",
        "surroundings",
        "heat",
        "work",
        "enthalpy",
        "exothermic",
        "endothermic",
        "state function"
      ]
    },
    {
      "id": "electronic",
      "semester": 1,
      "number": 7,
      "title": "Electronic Structure & Quantum Ideas",
      "subtitle": "Why electrons occupy orbitals instead of miniature planetary paths.",
      "prerequisite": "Atoms & the Mole; Energy",
      "outcomes": [
        "Relate wavelength, frequency and photon energy",
        "Explain why line spectra imply quantized energy levels",
        "Interpret principal quantum numbers and orbital types",
        "Write ground-state electron configurations using Aufbau, Pauli and Hund principles"
      ],
      "sections": [
        {
          "title": "Light behaves as both wave and quantized energy",
          "body": [
            "Electromagnetic radiation is characterized by wavelength λ and frequency ν, linked by the speed of light. Planck’s relation E = hν shows that electromagnetic energy is exchanged in packets called photons.",
            "Atomic line spectra occur because atoms absorb or emit only particular photon energies, implying discrete allowed energy differences rather than a continuous range."
          ]
        },
        {
          "title": "Orbitals are probability distributions",
          "body": [
            "The modern quantum model does not assign an electron a definite circular path. An orbital is a mathematical description of where an electron is likely to be found and of its energy. Principal shells are labeled by n; subshells s, p, d and f have characteristic shapes and numbers of orbitals.",
            "Each orbital can hold at most two electrons with opposite spin. Degenerate orbitals within a subshell fill singly before pairing, consistent with Hund’s rule."
          ]
        },
        {
          "title": "Electron configuration predicts chemical behavior",
          "body": [
            "Valence electrons are the electrons most involved in bonding and chemical change. Patterns in valence configuration repeat across the periodic table, which is why elements in the same group often react similarly."
          ]
        }
      ],
      "equations": [
        {
          "label": "Wave relation",
          "expression": "c = λν"
        },
        {
          "label": "Photon energy",
          "expression": "E = hν = hc/λ"
        }
      ],
      "example": {
        "prompt": "Write the ground-state electron configuration of phosphorus, Z = 15.",
        "steps": [
          "Fill orbitals in increasing-energy order.",
          "1s² 2s² 2p⁶ accounts for 10 electrons.",
          "Place the remaining 5 as 3s² 3p³; the three 3p electrons occupy separate p orbitals before pairing."
        ],
        "answer": "1s² 2s² 2p⁶ 3s² 3p³"
      },
      "check": {
        "question": "How many orbitals are in a p subshell?",
        "choices": [
          "1",
          "2",
          "3",
          "6"
        ],
        "answer": 2,
        "explanation": "A p subshell contains three orbitals. Each orbital can contain up to two electrons, so a p subshell can hold six electrons total."
      },
      "bridge": {
        "course": "Organic, inorganic & spectroscopy",
        "text": "Orbitals explain bonding, conjugation, transition-metal chemistry, UV/Vis spectroscopy and the electronic basis of molecular structure."
      },
      "lab": "Connects to emission spectra, quantitative graphing and the interpretation of discrete spectral lines.",
      "tool": null,
      "vocabulary": [
        "wavelength",
        "frequency",
        "photon",
        "orbital",
        "subshell",
        "electron configuration",
        "Pauli principle",
        "Hund rule"
      ]
    },
    {
      "id": "periodic",
      "semester": 1,
      "number": 8,
      "title": "Periodic Trends & Effective Nuclear Charge",
      "subtitle": "Using electron structure to predict how atoms behave.",
      "prerequisite": "Electronic Structure",
      "outcomes": [
        "Explain shielding and effective nuclear charge qualitatively",
        "Predict atomic and ionic radius trends",
        "Explain first-ionization-energy trends and common exceptions",
        "Relate electronegativity to bond polarity"
      ],
      "sections": [
        {
          "title": "The periodic table is an electron-structure map",
          "body": [
            "Across a period, nuclear charge increases while added electrons enter the same principal shell. Shielding does not increase enough to cancel the added proton attraction, so effective nuclear charge generally rises and atomic radius decreases.",
            "Down a group, electrons occupy higher principal shells farther from the nucleus, so atomic size usually increases despite the greater nuclear charge."
          ]
        },
        {
          "title": "Removing an electron requires energy",
          "body": [
            "Ionization energy is the energy required to remove an electron from a gas-phase species. It generally increases across a period and decreases down a group. Deviations are informative: they reflect subshell energies and electron pairing rather than invalidating the trend.",
            "Large jumps between successive ionization energies can reveal how many valence electrons were relatively easy to remove."
          ]
        },
        {
          "title": "Electronegativity forecasts unequal electron sharing",
          "body": [
            "Electronegativity describes an atom’s tendency to attract shared electrons in a bond. A difference in electronegativity creates bond polarity, but molecular polarity also depends on geometry and whether individual bond dipoles cancel."
          ]
        }
      ],
      "equations": [
        {
          "label": "Conceptual effective charge",
          "expression": "Z_eff ≈ Z − shielding"
        }
      ],
      "example": {
        "prompt": "Which is larger, Na or Na⁺, and why?",
        "steps": [
          "Na loses its 3s valence electron to form Na⁺.",
          "The cation has one fewer occupied shell and less electron–electron repulsion.",
          "The remaining electrons experience stronger effective attraction per electron."
        ],
        "answer": "Na is larger than Na⁺."
      },
      "check": {
        "question": "Which atom is expected to have the larger first ionization energy?",
        "choices": [
          "Na",
          "Mg",
          "K",
          "Rb"
        ],
        "answer": 1,
        "explanation": "Among these choices, Mg is farther right and in a smaller principal shell than K or Rb; its valence electron is held more strongly."
      },
      "bridge": {
        "course": "Organic reactivity & biochemistry",
        "text": "Electronegativity and size become nucleophilicity, acidity, bond polarization, hydrogen bonding and metal-ion behavior."
      },
      "lab": null,
      "tool": null,
      "vocabulary": [
        "shielding",
        "effective nuclear charge",
        "atomic radius",
        "ionic radius",
        "ionization energy",
        "electron affinity",
        "electronegativity"
      ]
    },
    {
      "id": "bonding",
      "semester": 1,
      "number": 9,
      "title": "Bonding, Lewis Structures & Resonance",
      "subtitle": "From valence electrons to stable connectivity.",
      "prerequisite": "Periodic Trends",
      "outcomes": [
        "Differentiate ionic, polar covalent and nonpolar covalent bonding models",
        "Construct Lewis structures from total valence-electron counts",
        "Use formal charge to compare plausible structures",
        "Represent resonance without treating contributors as rapidly switching molecules"
      ],
      "sections": [
        {
          "title": "Bonding lowers the energy of an arrangement",
          "body": [
            "Ionic bonding emphasizes electrostatic attraction between oppositely charged ions, while covalent bonding emphasizes shared electron density between nuclei. Real bonds often lie on a continuum, and electronegativity difference helps predict where shared electrons are concentrated.",
            "Bond strength and length reflect the balance of attractive and repulsive interactions. Higher bond order generally correlates with shorter, stronger bonds for comparable atom pairs."
          ]
        },
        {
          "title": "Lewis structures are electron-accounting models",
          "body": [
            "Begin by counting total valence electrons, including charge. Choose a reasonable skeleton, add bonds, complete terminal-atom octets and place remaining electrons on the central atom. If the central atom lacks an octet, multiple bonds may be required.",
            "Formal charge is bookkeeping, not a measured partial charge. Useful structures often minimize formal-charge magnitude and place negative formal charge on more electronegative atoms when other factors are comparable."
          ]
        },
        {
          "title": "Resonance describes delocalization",
          "body": [
            "When more than one valid Lewis structure differs only in electron placement, the actual electronic structure is a resonance hybrid. The atoms do not jump between contributors; electron density is delocalized. Resonance becomes one of the most important ideas in organic chemistry and biochemistry."
          ]
        }
      ],
      "equations": [
        {
          "label": "Formal charge",
          "expression": "FC = valence e⁻ − nonbonding e⁻ − ½(bonding e⁻)"
        },
        {
          "label": "Bond order idea",
          "expression": "higher bond order → usually shorter, stronger bond"
        }
      ],
      "example": {
        "prompt": "Find the formal charge on nitrogen in NH₄⁺.",
        "steps": [
          "Nitrogen has 5 valence electrons.",
          "In NH₄⁺, N has no nonbonding electrons and 8 bonding electrons.",
          "FC = 5 − 0 − ½(8) = +1."
        ],
        "answer": "Formal charge on N = +1"
      },
      "check": {
        "question": "Which statement about resonance is correct?",
        "choices": [
          "The molecule rapidly switches between Lewis structures",
          "Atoms move to new positions in each contributor",
          "The real structure is a delocalized hybrid",
          "Resonance only occurs in ions"
        ],
        "answer": 2,
        "explanation": "Resonance contributors are bookkeeping representations of one delocalized electronic structure."
      },
      "bridge": {
        "course": "Organic chemistry",
        "text": "Formal charge, resonance and bond polarization are the language of curved-arrow mechanisms, aromaticity, acidity and carbonyl chemistry."
      },
      "lab": "Supports solubility trends, structure–property reasoning and molecular-model interpretation.",
      "tool": null,
      "vocabulary": [
        "ionic bond",
        "covalent bond",
        "Lewis structure",
        "octet rule",
        "formal charge",
        "resonance",
        "bond order"
      ]
    },
    {
      "id": "geometry",
      "semester": 1,
      "number": 10,
      "title": "Molecular Geometry, Polarity & Bonding Models",
      "subtitle": "Turning a flat Lewis structure into a three-dimensional molecule.",
      "prerequisite": "Bonding & Lewis Structures",
      "outcomes": [
        "Use electron-domain count to predict electron geometry",
        "Distinguish electron geometry from molecular geometry",
        "Predict approximate bond angles and lone-pair distortions",
        "Combine bond dipoles as vectors to predict molecular polarity",
        "Recognize σ/π bonding and introductory hybridization models"
      ],
      "sections": [
        {
          "title": "Electron domains arrange in three dimensions",
          "body": [
            "VSEPR treats regions of valence electron density as repelling one another. Two domains favor linear separation, three trigonal planar, four tetrahedral, five trigonal bipyramidal and six octahedral. A multiple bond counts as one domain for geometry.",
            "Molecular geometry names the positions of atoms, so lone pairs can cause molecular geometry to differ from electron geometry. Lone pairs generally repel more strongly than bonding pairs and compress nearby bond angles."
          ]
        },
        {
          "title": "Bond polarity does not automatically mean molecular polarity",
          "body": [
            "A polar bond has unequal electron sharing and therefore a bond dipole. Molecular polarity is the vector sum of all bond dipoles and depends on three-dimensional arrangement. CO₂ contains polar C=O bonds but is nonpolar because its equal dipoles oppose perfectly in a linear geometry. Water is polar because its bent geometry prevents cancellation."
          ]
        },
        {
          "title": "σ and π models prepare you for organic chemistry",
          "body": [
            "A single bond is described as one σ bond. Double bonds contain one σ and one π bond; triple bonds contain one σ and two π bonds. Introductory hybridization labels sp, sp² and sp³ connect electron-domain geometry to directional bonding, although more advanced courses refine this model."
          ]
        }
      ],
      "equations": [
        {
          "label": "Dipole concept",
          "expression": "molecular dipole = vector sum of bond dipoles"
        },
        {
          "label": "Bond components",
          "expression": "single: 1σ • double: 1σ + 1π • triple: 1σ + 2π"
        }
      ],
      "example": {
        "prompt": "Predict the geometry and polarity of NH₃.",
        "steps": [
          "Nitrogen has three N–H bonds and one lone pair: four electron domains.",
          "Four domains give tetrahedral electron geometry; ignoring the lone pair gives trigonal-pyramidal molecular geometry.",
          "The N–H bond dipoles do not cancel in a trigonal-pyramidal shape."
        ],
        "answer": "Trigonal pyramidal; polar"
      },
      "check": {
        "question": "Which molecule is nonpolar because its bond dipoles cancel by symmetry?",
        "choices": [
          "H₂O",
          "NH₃",
          "CO₂",
          "SO₂"
        ],
        "answer": 2,
        "explanation": "CO₂ is linear with two equal C=O dipoles in opposite directions."
      },
      "bridge": {
        "course": "Organic chemistry & biochemistry",
        "text": "Shape controls stereochemistry, orbital overlap, receptor binding, protein folding and whether a reactive group can physically approach another."
      },
      "lab": "Directly paired with ChemAtlas’s interactive VSEPR Model Lab.",
      "tool": {
        "label": "Open 3D VSEPR Model Lab",
        "action": "lab"
      },
      "vocabulary": [
        "electron domain",
        "electron geometry",
        "molecular geometry",
        "bond dipole",
        "molecular polarity",
        "sigma bond",
        "pi bond",
        "hybridization"
      ]
    },
    {
      "id": "gases",
      "semester": 1,
      "number": 11,
      "title": "Gases & Kinetic Molecular Theory",
      "subtitle": "A quantitative model for particles in constant motion.",
      "prerequisite": "Stoichiometry; Thermochemistry",
      "outcomes": [
        "Relate pressure, volume, temperature and amount",
        "Apply the ideal gas law with consistent units",
        "Use Dalton’s law for gas mixtures",
        "Connect macroscopic gas behavior to particle motion using kinetic molecular theory"
      ],
      "sections": [
        {
          "title": "Gas variables are strongly coupled",
          "body": [
            "Gas pressure comes from molecular collisions with container walls. Increasing temperature raises average molecular kinetic energy, while changing volume changes how frequently particles strike the walls.",
            "The ideal gas law combines the relationships among pressure P, volume V, amount n and absolute temperature T. Temperature must be expressed in kelvin because gas-law proportionalities are anchored to absolute zero."
          ]
        },
        {
          "title": "Mixture pressure is additive for ideal gases",
          "body": [
            "Dalton’s law states that total pressure is the sum of component partial pressures. A gas’s partial pressure is proportional to its mole fraction in an ideal mixture. This idea becomes useful in respiration, gas collection and equilibrium systems."
          ]
        },
        {
          "title": "Kinetic molecular theory explains the equations",
          "body": [
            "The ideal model assumes particles occupy negligible volume, experience negligible intermolecular attractions and collide elastically. Real gases deviate most when particles are crowded at high pressure or attractions become important at low temperature."
          ]
        }
      ],
      "equations": [
        {
          "label": "Ideal gas law",
          "expression": "PV = nRT"
        },
        {
          "label": "Dalton’s law",
          "expression": "P_total = ΣPᵢ"
        },
        {
          "label": "Mole fraction pressure",
          "expression": "Pᵢ = χᵢP_total"
        }
      ],
      "example": {
        "prompt": "What volume does 0.500 mol ideal gas occupy at 1.00 atm and 298 K? Use R = 0.082057 L·atm·mol⁻¹·K⁻¹.",
        "steps": [
          "Rearrange PV = nRT to V = nRT/P.",
          "V = (0.500)(0.082057)(298)/(1.00).",
          "Round to three significant figures."
        ],
        "answer": "12.2 L"
      },
      "check": {
        "question": "At constant amount and volume, what happens to ideal-gas pressure when Kelvin temperature doubles?",
        "choices": [
          "It halves",
          "It stays constant",
          "It doubles",
          "It quadruples"
        ],
        "answer": 2,
        "explanation": "From PV = nRT, with n and V fixed, P is directly proportional to absolute temperature."
      },
      "bridge": {
        "course": "Physical chemistry & biochemistry",
        "text": "Gas behavior leads into statistical mechanics, thermodynamics, respiration, oxygen transport and partial-pressure-driven processes."
      },
      "lab": "Directly connects to the UArk majors-lab gas-law emphasis and quantitative data interpretation.",
      "tool": null,
      "vocabulary": [
        "pressure",
        "ideal gas",
        "partial pressure",
        "mole fraction",
        "kinetic molecular theory",
        "absolute temperature"
      ]
    },
    {
      "id": "imf",
      "semester": 2,
      "number": 12,
      "title": "Intermolecular Forces, Liquids & Solids",
      "subtitle": "Why molecules with similar bonds can have very different bulk properties.",
      "prerequisite": "Molecular Geometry & Polarity",
      "outcomes": [
        "Distinguish intramolecular bonds from intermolecular attractions",
        "Identify London dispersion, dipole–dipole and hydrogen-bonding interactions",
        "Relate intermolecular forces to boiling point, viscosity and vapor pressure",
        "Interpret heating curves and phase diagrams"
      ],
      "sections": [
        {
          "title": "Intermolecular attractions act between particles",
          "body": [
            "Covalent or ionic bonds hold atoms together within a substance; intermolecular forces act between molecules or particles. Breaking intermolecular attractions during boiling does not break the covalent bonds within each molecule.",
            "All atoms and molecules experience London dispersion forces arising from temporary fluctuations in electron distribution. Larger, more polarizable electron clouds usually generate stronger dispersion."
          ]
        },
        {
          "title": "Polarity adds directional attractions",
          "body": [
            "Polar molecules experience dipole–dipole attractions. Hydrogen bonding is a particularly strong, directional interaction when H is covalently bonded to N, O or F and interacts with a lone pair on a suitable partner.",
            "Stronger intermolecular attractions generally raise boiling point and viscosity while lowering vapor pressure at a given temperature."
          ]
        },
        {
          "title": "Phase changes balance energy and molecular freedom",
          "body": [
            "Melting, vaporization and sublimation are endothermic because energy is required to overcome attractions. During a phase change at constant pressure, added heat changes the phase rather than the temperature until the transition is complete."
          ]
        }
      ],
      "equations": [
        {
          "label": "Phase-change heat",
          "expression": "q = nΔH_phase"
        },
        {
          "label": "Heating within a phase",
          "expression": "q = mcΔT"
        }
      ],
      "example": {
        "prompt": "Why does water boil at a much higher temperature than H₂S even though both are group-16 hydrides?",
        "steps": [
          "Both have dispersion interactions.",
          "Water molecules can form an extensive hydrogen-bond network because O–H bonds are highly polar and oxygen has lone pairs.",
          "H₂S does not form comparably strong classical hydrogen bonding."
        ],
        "answer": "Stronger hydrogen bonding in water requires more energy to separate molecules into the gas phase."
      },
      "check": {
        "question": "Which change generally accompanies stronger intermolecular forces?",
        "choices": [
          "Higher vapor pressure",
          "Lower boiling point",
          "Higher boiling point",
          "Lower viscosity"
        ],
        "answer": 2,
        "explanation": "Stronger attractions require more energy for molecules to escape into the gas phase, so boiling point tends to rise."
      },
      "bridge": {
        "course": "Organic & biochemistry",
        "text": "Solubility, chromatographic retention, membrane formation, protein folding and drug binding all depend on competing intermolecular interactions."
      },
      "lab": null,
      "tool": null,
      "vocabulary": [
        "London dispersion",
        "dipole–dipole",
        "hydrogen bonding",
        "polarizability",
        "vapor pressure",
        "phase diagram"
      ]
    },
    {
      "id": "solutions",
      "semester": 2,
      "number": 13,
      "title": "Solutions, Concentration & Colligative Properties",
      "subtitle": "What determines how much dissolves and what dissolved particles do.",
      "prerequisite": "Intermolecular Forces",
      "outcomes": [
        "Use molarity, molality and mole fraction appropriately",
        "Explain “like dissolves like” in terms of competing interactions",
        "Apply dilution and solution-stoichiometry relationships",
        "Predict qualitative colligative-property changes"
      ],
      "sections": [
        {
          "title": "Dissolving requires favorable competition",
          "body": [
            "For a solution to form, solute–solute and solvent–solvent attractions are disrupted and replaced by solute–solvent attractions. “Like dissolves like” is shorthand for matching interaction types, not a universal law.",
            "Ionic solutes can dissolve in polar solvents when ion–dipole stabilization compensates for separating ions from the crystal lattice."
          ]
        },
        {
          "title": "Concentration can be expressed several ways",
          "body": [
            "Molarity uses moles of solute per liter of solution and is convenient for volumetric chemistry, but it changes slightly with temperature because volume changes. Molality uses moles per kilogram of solvent and is temperature independent."
          ]
        },
        {
          "title": "Colligative properties count dissolved particles",
          "body": [
            "Ideal colligative effects depend primarily on the number of dissolved particles, not their identity. Nonvolatile solutes lower vapor pressure, elevate boiling point and depress freezing point. Electrolytes can generate multiple ions, represented approximately by the van’t Hoff factor i."
          ]
        }
      ],
      "equations": [
        {
          "label": "Molarity",
          "expression": "M = mol solute / L solution"
        },
        {
          "label": "Molality",
          "expression": "m = mol solute / kg solvent"
        },
        {
          "label": "Freezing-point depression",
          "expression": "ΔT_f = iK_fm"
        }
      ],
      "example": {
        "prompt": "How many moles NaCl are in 250.0 mL of 0.200 M NaCl?",
        "steps": [
          "Convert 250.0 mL to 0.2500 L.",
          "mol = M × V = 0.200 mol/L × 0.2500 L."
        ],
        "answer": "0.0500 mol NaCl"
      },
      "check": {
        "question": "Which solution ideally has the greatest freezing-point depression at the same molality?",
        "choices": [
          "Glucose",
          "NaCl",
          "CaCl₂",
          "All are identical"
        ],
        "answer": 2,
        "explanation": "CaCl₂ ideally produces about three ions per formula unit, giving the largest particle count and largest colligative effect."
      },
      "bridge": {
        "course": "Analytical chemistry & biochemistry",
        "text": "Concentration units underpin buffers, assays, standard solutions, osmotic effects and preparation of biological media."
      },
      "lab": "Closely connected to freezing-point depression, solubility and solution preparation.",
      "tool": null,
      "vocabulary": [
        "molarity",
        "molality",
        "mole fraction",
        "solvation",
        "colligative property",
        "van’t Hoff factor",
        "osmosis"
      ]
    },
    {
      "id": "kinetics",
      "semester": 2,
      "number": 14,
      "title": "Chemical Kinetics",
      "subtitle": "How fast reactions happen and what controls the rate.",
      "prerequisite": "Stoichiometry; Energy",
      "outcomes": [
        "Define reaction rate from concentration change",
        "Determine rate-law form from experimental data",
        "Use integrated rate laws for common reaction orders",
        "Interpret activation energy and catalysts using collision/transition-state ideas"
      ],
      "sections": [
        {
          "title": "Thermodynamic possibility and kinetic speed are different questions",
          "body": [
            "A reaction can be energetically favorable yet proceed extremely slowly because reactants must cross an activation barrier. Kinetics studies how concentration changes with time and which molecular events control that rate.",
            "Reaction rate is normalized by stoichiometric coefficient so disappearance and appearance rates describe one consistent reaction progress."
          ]
        },
        {
          "title": "Rate laws are empirical",
          "body": [
            "A rate law such as rate = k[A]^m[B]^n must be determined experimentally for a reaction mechanism under given conditions. The exponents are reaction orders and are not generally obtained from the overall balanced equation.",
            "Integrated rate laws relate concentration directly to time. A first-order process gives a linear plot of ln[A] versus time and has a concentration-independent half-life."
          ]
        },
        {
          "title": "Catalysts lower the kinetic barrier",
          "body": [
            "A catalyst provides an alternative reaction pathway with lower activation energy and speeds both forward and reverse reactions. It does not change the reaction’s equilibrium constant or overall thermodynamic driving force."
          ]
        }
      ],
      "equations": [
        {
          "label": "General rate law",
          "expression": "rate = k[A]^m[B]^n"
        },
        {
          "label": "First-order integrated law",
          "expression": "ln[A]ₜ = ln[A]₀ − kt"
        },
        {
          "label": "Arrhenius equation",
          "expression": "k = Ae^(−Eₐ/RT)"
        }
      ],
      "example": {
        "prompt": "A first-order reaction has k = 0.0350 min⁻¹. What is its half-life?",
        "steps": [
          "For a first-order reaction, t₁/₂ = ln2/k.",
          "0.693 / 0.0350 min⁻¹ = 19.8 min."
        ],
        "answer": "19.8 min"
      },
      "check": {
        "question": "What does a catalyst change?",
        "choices": [
          "ΔG° of reaction",
          "Equilibrium constant",
          "Activation energy",
          "Stoichiometric coefficients"
        ],
        "answer": 2,
        "explanation": "A catalyst changes the pathway and lowers activation energy without changing the initial/final thermodynamic states."
      },
      "bridge": {
        "course": "Physical chemistry & enzyme kinetics",
        "text": "Mechanistic kinetics becomes reaction dynamics in physical chemistry and Michaelis–Menten/catalytic reasoning in biochemistry."
      },
      "lab": null,
      "tool": null,
      "vocabulary": [
        "reaction rate",
        "rate law",
        "reaction order",
        "rate constant",
        "half-life",
        "activation energy",
        "catalyst"
      ]
    },
    {
      "id": "equilibrium",
      "semester": 2,
      "number": 15,
      "title": "Chemical Equilibrium",
      "subtitle": "Dynamic balance and the reaction quotient.",
      "prerequisite": "Kinetics",
      "outcomes": [
        "Explain equilibrium as a dynamic state",
        "Write equilibrium-constant expressions",
        "Use Q versus K to predict direction of change",
        "Apply ICE-table reasoning to simple equilibrium calculations",
        "Use Le Châtelier’s principle as a qualitative consequence of Q and K"
      ],
      "sections": [
        {
          "title": "Equilibrium is dynamic, not static",
          "body": [
            "At equilibrium, forward and reverse reaction rates are equal, so macroscopic concentrations remain constant even though molecular reactions continue. Equal rates do not imply equal concentrations.",
            "The equilibrium constant K relates activities or, in introductory approximations, equilibrium concentrations or partial pressures raised to stoichiometric powers. Pure solids and liquids are omitted from common K expressions."
          ]
        },
        {
          "title": "Q tells where the system is right now",
          "body": [
            "The reaction quotient Q has the same form as K but uses current, not necessarily equilibrium, composition. If Q < K, the system proceeds forward; if Q > K, it proceeds in reverse; if Q = K, it is at equilibrium."
          ]
        },
        {
          "title": "Disturbances change composition, not K unless temperature changes",
          "body": [
            "Adding a reactant, removing a product or changing volume can make Q differ from K, causing the system to shift until Q returns to K. For a given reaction, only temperature changes K itself. This is the quantitative foundation underneath Le Châtelier’s principle."
          ]
        }
      ],
      "equations": [
        {
          "label": "Generic concentration equilibrium",
          "expression": "K_c = [products]^coeff / [reactants]^coeff"
        },
        {
          "label": "Direction test",
          "expression": "Q < K → forward • Q > K → reverse"
        }
      ],
      "example": {
        "prompt": "For A ⇌ B, K = 4.0. If [A] = 1.0 M and [B] = 1.0 M, which direction will the system initially shift?",
        "steps": [
          "Q = [B]/[A] = 1.0.",
          "Compare Q = 1.0 with K = 4.0.",
          "Because Q < K, more products must form."
        ],
        "answer": "The reaction shifts forward, toward B."
      },
      "check": {
        "question": "Which change alters the numerical value of K for a given reaction?",
        "choices": [
          "Adding reactant",
          "Removing product",
          "Changing container volume",
          "Changing temperature"
        ],
        "answer": 3,
        "explanation": "Composition or volume changes can shift the system, but K itself changes with temperature."
      },
      "bridge": {
        "course": "Biochemistry & analytical chemistry",
        "text": "Binding, acid–base behavior, metal complexation, enzyme equilibria and coupled biochemical reactions all use equilibrium logic."
      },
      "lab": null,
      "tool": null,
      "vocabulary": [
        "dynamic equilibrium",
        "equilibrium constant",
        "reaction quotient",
        "ICE table",
        "Le Châtelier principle"
      ]
    },
    {
      "id": "acidbase",
      "semester": 2,
      "number": 16,
      "title": "Acids, Bases & Buffers",
      "subtitle": "Proton transfer, pH and chemical resistance to change.",
      "prerequisite": "Chemical Equilibrium",
      "outcomes": [
        "Use Brønsted–Lowry acid/base definitions",
        "Relate Ka, Kb, pKa and conjugate strength",
        "Calculate pH for common strong and weak acid/base cases",
        "Explain buffer action and use Henderson–Hasselbalch appropriately",
        "Interpret titration regions qualitatively"
      ],
      "sections": [
        {
          "title": "Acid–base reactions are proton-transfer equilibria",
          "body": [
            "A Brønsted acid donates H⁺ and a Brønsted base accepts H⁺. Every acid has a conjugate base formed after proton donation, and every base has a conjugate acid formed after proton acceptance.",
            "Strong acids are treated as essentially fully ionized in dilute water, while weak acids establish equilibria described by Ka. A smaller pKa corresponds to a stronger acid."
          ]
        },
        {
          "title": "pH compresses a huge concentration range",
          "body": [
            "pH = −log[H₃O⁺] converts hydronium concentration into a manageable logarithmic scale. At 25 °C, Kw = 1.0 × 10⁻¹⁴ and pH + pOH = 14.00 for ideal dilute aqueous solutions."
          ]
        },
        {
          "title": "Buffers use a weak acid/base pair as a reservoir",
          "body": [
            "A buffer contains appreciable amounts of a weak acid and its conjugate base, or a weak base and conjugate acid. Added H⁺ is consumed primarily by the base component; added OH⁻ is consumed by the acid component.",
            "The Henderson–Hasselbalch equation is most useful when both conjugate partners are present in meaningful amounts. Near pH = pKa, buffer capacity is typically effective and the acid/base ratio is near one."
          ]
        }
      ],
      "equations": [
        {
          "label": "Acid dissociation",
          "expression": "Kₐ = [H₃O⁺][A⁻] / [HA]"
        },
        {
          "label": "pH",
          "expression": "pH = −log[H₃O⁺]"
        },
        {
          "label": "Henderson–Hasselbalch",
          "expression": "pH = pKₐ + log([A⁻]/[HA])"
        }
      ],
      "example": {
        "prompt": "A buffer has equal concentrations of acetic acid and acetate. If pKa = 4.76, what is the pH?",
        "steps": [
          "Use Henderson–Hasselbalch.",
          "[A⁻]/[HA] = 1, and log(1) = 0.",
          "Therefore pH = pKa."
        ],
        "answer": "pH = 4.76"
      },
      "check": {
        "question": "If pH is one unit above pKa, which form predominates?",
        "choices": [
          "Protonated acid HA by 10:1",
          "Conjugate base A⁻ by 10:1",
          "They are equal",
          "Cannot be determined"
        ],
        "answer": 1,
        "explanation": "pH − pKa = 1 = log([A⁻]/[HA]), so [A⁻]/[HA] = 10."
      },
      "bridge": {
        "course": "Biochemistry",
        "text": "Protein charge, enzyme catalysis, amino-acid ionization, DNA chemistry and physiological buffering are direct extensions of this module."
      },
      "lab": null,
      "tool": null,
      "vocabulary": [
        "Brønsted acid",
        "Brønsted base",
        "conjugate pair",
        "Ka",
        "pKa",
        "pH",
        "buffer",
        "titration"
      ]
    },
    {
      "id": "solubility",
      "semester": 2,
      "number": 17,
      "title": "Solubility & Coupled Equilibria",
      "subtitle": "When precipitation, complexation and acid–base chemistry compete.",
      "prerequisite": "Equilibrium; Acids & Bases",
      "outcomes": [
        "Write Ksp expressions",
        "Use ion products to predict precipitation",
        "Apply common-ion reasoning",
        "Recognize how pH and complex formation can change apparent solubility"
      ],
      "sections": [
        {
          "title": "Sparingly soluble solids establish equilibria",
          "body": [
            "A salt can be described by a dissolution equilibrium between the solid and its dissolved ions. The solubility-product constant Ksp contains only dissolved species because the pure solid’s activity is treated as constant.",
            "Comparing the ionic reaction quotient Qsp with Ksp predicts whether a solution is unsaturated, saturated or supersaturated with respect to a solid."
          ]
        },
        {
          "title": "Equilibria couple to one another",
          "body": [
            "If one dissolved ion is consumed by another equilibrium, dissolution can be pulled forward. For example, salts containing basic anions may become more soluble in acid because protonation removes the free anion from solution.",
            "Complex-ion formation can similarly stabilize a dissolved metal ion, changing apparent solubility. This network perspective is more powerful than memorizing isolated “solubility rules.”"
          ]
        }
      ],
      "equations": [
        {
          "label": "Example Ksp",
          "expression": "MX(s) ⇌ M⁺ + X⁻ ; Ksp = [M⁺][X⁻]"
        },
        {
          "label": "Precipitation test",
          "expression": "Qsp > Ksp → precipitation favored"
        }
      ],
      "example": {
        "prompt": "For AgCl, Ksp = 1.8 × 10⁻¹⁰. In pure water, approximate the molar solubility s.",
        "steps": [
          "AgCl(s) ⇌ Ag⁺ + Cl⁻.",
          "In pure water, [Ag⁺] = [Cl⁻] = s.",
          "Ksp = s², so s = √(1.8 × 10⁻¹⁰)."
        ],
        "answer": "s ≈ 1.34 × 10⁻⁵ M"
      },
      "check": {
        "question": "Adding NaCl to a saturated AgCl solution generally does what to AgCl solubility?",
        "choices": [
          "Increases it",
          "Decreases it",
          "Leaves it unchanged",
          "Makes Ksp larger"
        ],
        "answer": 1,
        "explanation": "Added Cl⁻ is a common ion, increasing Qsp and shifting the dissolution equilibrium toward solid AgCl. Ksp itself is unchanged at fixed temperature."
      },
      "bridge": {
        "course": "Analytical & inorganic chemistry",
        "text": "Selective precipitation, complexometric analysis and metal-ion speciation require coupled-equilibrium reasoning."
      },
      "lab": null,
      "tool": null,
      "vocabulary": [
        "Ksp",
        "molar solubility",
        "common-ion effect",
        "ion product",
        "complex ion",
        "coupled equilibrium"
      ]
    },
    {
      "id": "thermodynamics",
      "semester": 2,
      "number": 18,
      "title": "Entropy, Free Energy & Spontaneity",
      "subtitle": "Why some energetically costly processes can still proceed.",
      "prerequisite": "Thermochemistry; Equilibrium",
      "outcomes": [
        "Interpret entropy as dispersal/multiplicity rather than “disorder” alone",
        "Use qualitative entropy trends",
        "Relate ΔG, ΔH and ΔS",
        "Connect standard free energy to equilibrium constants",
        "Distinguish thermodynamic favorability from reaction rate"
      ],
      "sections": [
        {
          "title": "Entropy tracks energy and matter dispersal",
          "body": [
            "Entropy S is connected to the number of microscopic arrangements compatible with a macroscopic state. Processes that increase the number of accessible arrangements often have positive ΔS. Gas formation, mixing and greater molecular freedom commonly increase entropy.",
            "“Disorder” can be a useful first intuition but is too vague for careful reasoning; the statistical interpretation is more reliable."
          ]
        },
        {
          "title": "Gibbs free energy combines enthalpy and entropy",
          "body": [
            "At constant temperature and pressure, ΔG = ΔH − TΔS predicts thermodynamic direction. ΔG < 0 indicates a forward process is favorable under the specified conditions; ΔG > 0 favors the reverse; ΔG = 0 corresponds to equilibrium.",
            "A favorable ΔG says nothing about how fast a process occurs. Diamond converting to graphite is thermodynamically favorable under ordinary conditions but kinetically extremely slow."
          ]
        },
        {
          "title": "Free energy and equilibrium are the same story",
          "body": [
            "Standard free energy and the equilibrium constant are linked by ΔG° = −RT ln K. A large K corresponds to negative ΔG° and product-favored standard equilibrium, while a small K corresponds to positive ΔG°."
          ]
        }
      ],
      "equations": [
        {
          "label": "Gibbs free energy",
          "expression": "ΔG = ΔH − TΔS"
        },
        {
          "label": "Free energy & equilibrium",
          "expression": "ΔG° = −RT ln K"
        }
      ],
      "example": {
        "prompt": "At 298 K, a process has ΔH = +20.0 kJ/mol and ΔS = +100 J mol⁻¹ K⁻¹. Estimate ΔG.",
        "steps": [
          "Convert ΔS to 0.100 kJ mol⁻¹ K⁻¹.",
          "TΔS = (298)(0.100) = 29.8 kJ/mol.",
          "ΔG = 20.0 − 29.8 = −9.8 kJ/mol."
        ],
        "answer": "ΔG ≈ −9.8 kJ/mol; favorable under these conditions"
      },
      "check": {
        "question": "A reaction with ΔG° < 0 necessarily has what property?",
        "choices": [
          "It is fast",
          "K > 1",
          "ΔH < 0",
          "No activation barrier"
        ],
        "answer": 1,
        "explanation": "ΔG° = −RT lnK. If ΔG° is negative, lnK is positive and K > 1. Rate is a kinetic question."
      },
      "bridge": {
        "course": "Physical chemistry & biochemistry",
        "text": "This becomes chemical potential and statistical thermodynamics in p-chem, and reaction coupling/ATP energetics in biochemistry."
      },
      "lab": null,
      "tool": null,
      "vocabulary": [
        "entropy",
        "microstate",
        "Gibbs free energy",
        "spontaneity",
        "standard state",
        "reaction coupling"
      ]
    },
    {
      "id": "electrochem",
      "semester": 2,
      "number": 19,
      "title": "Electrochemistry",
      "subtitle": "Turning redox chemistry into electrical work.",
      "prerequisite": "Redox; Thermodynamics",
      "outcomes": [
        "Write oxidation and reduction half-reactions",
        "Identify anode, cathode and electron-flow direction",
        "Calculate standard cell potential from reduction potentials",
        "Relate cell potential to free energy and equilibrium",
        "Use the Nernst equation conceptually for nonstandard conditions"
      ],
      "sections": [
        {
          "title": "Electrochemical cells spatially separate redox half-reactions",
          "body": [
            "Oxidation occurs at the anode and reduction at the cathode in both galvanic and electrolytic cells. In a spontaneous galvanic cell, electrons travel through the external circuit from anode to cathode.",
            "A salt bridge or porous separator maintains charge balance by allowing ion migration without directly mixing the half-cell solutions too quickly."
          ]
        },
        {
          "title": "Cell potential measures driving force per charge",
          "body": [
            "Standard reduction potentials are tabulated for half-reactions written as reductions. For a chosen spontaneous cell, E°cell = E°cathode − E°anode. A positive E°cell corresponds to negative ΔG° for the cell reaction.",
            "The Nernst equation shows how potential changes as composition moves away from standard-state conditions and approaches equilibrium."
          ]
        },
        {
          "title": "Redox connects chemistry to biology and technology",
          "body": [
            "Batteries, corrosion, electroplating, sensors and biological electron transport all operate by controlling where oxidation and reduction occur. The mitochondrial electron transport chain can be viewed as a sequence of coupled redox steps that convert electron-transfer free energy into a proton gradient."
          ]
        }
      ],
      "equations": [
        {
          "label": "Standard cell potential",
          "expression": "E°cell = E°cathode − E°anode"
        },
        {
          "label": "Electrical free energy",
          "expression": "ΔG° = −nFE°cell"
        },
        {
          "label": "Nernst form",
          "expression": "E = E° − (RT/nF) ln Q"
        }
      ],
      "example": {
        "prompt": "Given E°red(Cu²⁺/Cu) = +0.34 V and E°red(Zn²⁺/Zn) = −0.76 V, find E°cell for Zn | Zn²⁺ || Cu²⁺ | Cu.",
        "steps": [
          "Cu²⁺ is reduced at the cathode; Zn is oxidized at the anode.",
          "E°cell = E°cathode − E°anode.",
          "0.34 − (−0.76) = 1.10 V."
        ],
        "answer": "E°cell = +1.10 V"
      },
      "check": {
        "question": "In a spontaneous galvanic cell, electrons flow through the wire from…",
        "choices": [
          "cathode to anode",
          "anode to cathode",
          "salt bridge to cathode",
          "solution to salt bridge"
        ],
        "answer": 1,
        "explanation": "Oxidation at the anode produces electrons; reduction at the cathode consumes them."
      },
      "bridge": {
        "course": "Biochemistry & analytical chemistry",
        "text": "Electrodes become potentiometric sensors in analytical chemistry; redox potentials organize electron transfer through NADH, flavins, quinones and respiratory complexes in biochemistry."
      },
      "lab": null,
      "tool": null,
      "vocabulary": [
        "anode",
        "cathode",
        "galvanic cell",
        "electrolytic cell",
        "cell potential",
        "reduction potential",
        "Nernst equation"
      ]
    }
  ]
};
