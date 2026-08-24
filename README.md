# ChemAtlas — Interactive Chemistry Curriculum

ChemAtlas is a browser-based learning platform prototype that connects a real college chemistry sequence to interactive models. The goal is to let students move from **atomic structure → bonding → organic chemistry → physical chemistry → biochemistry** while preserving the conceptual links between courses.

Live site: `https://dhwisdom.github.io/chematlas/`

## Implemented

### Curriculum + platform shell
- Dashboard with a prerequisite-oriented chemistry pathway
- Four-year curriculum map based on the **University of Arkansas 2026–27 B.S. Chemistry with Biochemistry concentration**
- Course library with General Chemistry I, General Chemistry II, Organic Chemistry I/II, and Biochemistry scaffolds
- PostgreSQL/Supabase-ready normalized data model in `schema.sql`
- Responsive static architecture suitable for GitHub Pages

### General Chemistry Foundations — learning + modeling
- Full two-semester **General Chemistry Foundations** reader with 19 modules
- Original learning material covering measurement, atoms/moles, formulas, stoichiometry, aqueous chemistry, thermochemistry, electronic structure, periodicity, bonding, molecular geometry, gases, intermolecular forces, solutions, kinetics, equilibrium, acids/bases, solubility, thermodynamics, and electrochemistry
- Every module includes learning objectives, concept explanations, core equations, a worked example, vocabulary, a course-connection note, and an auto-checked mastery question
- Local progress tracking for completed modules and semester progress
- Searchable module navigator and Gen Chem I / Gen Chem II semester switcher
- Lab-connection callouts, including explicit ties to the UArk majors-lab emphasis on density, reaction types, separations, solubility, hydrates, gas laws, freezing-point depression, and data interpretation
- Interactive **Molecular Geometry & VSEPR** lesson with a self-contained rotatable Canvas molecular renderer
- CH4, NH3, H2O, CO2, BF3, PCl5 and SF6 with stick and space-filling representations
- Geometry, bond-angle, introductory hybridization and polarity explanations

### General Chemistry Foundation Practice Lab
- **Periodic Trends Explorer** for the first 36 elements with approximate atomic radius, first-ionization-energy, and electronegativity data plus randomized comparison challenges
- **Lewis Structure & Formal Charge Builder** for CO2, NH4+, NO3−, and SO2 with bond-order selection, electron-budget checking, inferred terminal lone pairs, and formal-charge calculation
- **Equation Balancing Trainer** with randomized reactions, coefficient input, full reactant/product atom counts, and smallest-whole-number-ratio feedback
- **Randomized Stoichiometry Generator** using dimensional analysis, molar-mass calculation from molecular formulas, mole ratios, and answer validation
- **Acid–Base & Buffer Workbench** for ideal strong acids/bases plus Henderson–Hasselbalch buffer calculations and target-pH ratio reasoning
- **Reaction Quotient + ICE Table Explorer** with Q-vs-K direction prediction and numerical equilibrium solving without relying on a small-x approximation
- **Virtual Coffee-Cup Calorimetry Lab** for HCl/NaOH neutralization with adjustable volumes, concentrations, initial temperature, limiting-reagent calculation, q = mcΔT, and predicted final temperature
- Local practice-tool mastery tracking across all seven interactive engines

### Phase 2 — Organic Chemistry Studio
- **R/S stereochemistry trainer** with CIP priorities, wedge/dash bonds and multiple challenges
- **Newman projection explorer** for butane with a rotatable C2–C3 dihedral angle, conformation labels and approximate relative-energy profile
- **Cyclohexane chair-flip explorer** showing axial/equatorial interchange, 1,3-diaxial contacts and substituent size effects
- **Curved-arrow mechanism trainer** for an SN2 reaction, enforcing the rule that arrows begin at electron pairs or bonds
- Expanded Organic Chemistry I curriculum modules and an Organic Chemistry II course scaffold

## Run locally

The current version is intentionally framework-free.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

You can also open `index.html` directly in a modern browser, although serving the directory locally more closely matches GitHub Pages behavior.

## Academic grounding

The degree sequence is modeled on the University of Arkansas 2026–27 B.S. Chemistry with Biochemistry concentration. It includes general chemistry, analytical chemistry, organic chemistry I/II, physical chemistry I/II, biochemistry, genetics, biochemical techniques and instrumental analysis.

ACS curriculum guidance is used as a second design constraint: introductory chemistry should lead into breadth across analytical, biochemistry, inorganic, organic and physical chemistry. ASBMB's core-concept framing is a future constraint for the biochemistry branch, especially energy/metabolism, structure/function, information flow and quantitative scientific skills.

The General Chemistry sequence is an original ChemAtlas instructional design aligned to the UArk degree/course context, ACS introductory-chemistry expectations, and the common two-semester scope represented by OpenStax Chemistry 2e. It is **not** a reproduction of or substitute for an official University of Arkansas syllabus. Learning text and worked examples in ChemAtlas are original content.

## Architecture

```text
Programs
  └── Courses
       └── Modules
            └── Lessons
                 ├── Concepts
                 │    └── Concept prerequisites
                 ├── Visualizations
                 └── Assessments

Users
  └── Learner progress / mastery
```

## Current build priorities

General Chemistry remains the platform’s prerequisite backbone. The next depth upgrades should add larger randomized problem banks, limiting-reactant and percent-yield modes, weak-acid/base equilibrium practice, titration curves, solubility-product simulations, kinetics data fitting, cumulative unit exams, and richer virtual-lab datasets before later courses are treated as complete.

## Next major phase — Biochemistry systems

- amino-acid ionization visualizer
- protein structure viewer
- enzyme kinetics simulator
- glycolysis + Krebs cycle interactive carbon tracing
- electron transport / chemiosmosis simulation
- pathway overlays for ATP, NADH, FADH2 and carbon loss
- fed/fasting pathway-state comparisons

## Production direction

A later production version can migrate to:

- Next.js / TypeScript
- Supabase / PostgreSQL
- 3Dmol.js for small-molecule visualization
- Mol* for proteins and macromolecules
- RDKit services for cheminformatics
- D3 for metabolic pathways and concept graphs
- KaTeX for mathematical and chemical notation

The current renderer, General Chemistry reader/practice lab, and Organic Studio are intentionally self-contained so the public prototype works on GitHub Pages with no API keys or external runtime dependencies.
