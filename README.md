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

### Phase 1 — General Chemistry modeling
- Interactive **Molecular Geometry & VSEPR** lesson
- Self-contained rotatable Canvas molecular renderer
- CH4, NH3, H2O, CO2, BF3, PCl5 and SF6
- Stick and space-filling representations
- Geometry, bond-angle, introductory hybridization and polarity explanations
- Mastery quiz with lightweight local progress storage

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

The lesson and module breakdowns inside courses are ChemAtlas instructional-design proposals, not reproductions of University of Arkansas syllabi.

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

## Next phase — Biochemistry systems

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

The current renderer and Organic Studio are intentionally self-contained so the public prototype works on GitHub Pages with no API keys or external runtime dependencies.
