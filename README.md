# ChemAtlas — Interactive Chemistry Curriculum Prototype

ChemAtlas is a browser-based prototype for a college-sequenced chemistry learning platform. The goal is to connect formal curriculum structure with interactive models so students can move from **atomic structure → bonding → organic chemistry → physical chemistry → biochemistry** without treating each course as an isolated subject.

## What is implemented

- Dashboard with a prerequisite-oriented chemistry pathway
- Four-year curriculum map based on the **University of Arkansas 2026–27 B.S. Chemistry with Biochemistry concentration**
- Course library with a detailed General Chemistry I scaffold
- Interactive **Molecular Geometry & VSEPR** lesson
- Self-contained rotatable 3D molecular rendering using a lightweight Canvas renderer
- Molecule selector for CH4, NH3, H2O, CO2, BF3, PCl5 and SF6
- Stick and space-filling representations
- Geometry, bond-angle, introductory hybridization and polarity explanations
- Three-question mastery check with lightweight local progress storage
- PostgreSQL/Supabase-ready data model in `schema.sql`

## Run it

The project is intentionally static for the first prototype.

1. Open `index.html` directly in a modern browser, or
2. For a local web server, run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Academic grounding

The degree sequence is modeled on the University of Arkansas 2026–27 B.S. Chemistry with Biochemistry concentration. It contains general chemistry, analytical chemistry, organic chemistry I/II, physical chemistry I/II, biochemistry, genetics, biochemical techniques and instrumental analysis.

ACS curriculum guidance is used as a second design constraint: introductory chemistry should lead into breadth across analytical, biochemistry, inorganic, organic and physical chemistry. ASBMB's core-concept framing is a good future constraint for the biochemistry branch, especially energy/metabolism, structure/function, information flow and quantitative scientific skills.

The lesson/module breakdown inside individual courses is a ChemAtlas instructional design proposal, not a reproduction of a University of Arkansas syllabus.

## Suggested product architecture

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

See `schema.sql` for a normalized implementation.

## Next development phases

### Phase 2 — Organic Chemistry modeling
- 3D structure builder
- stereochemistry / R-S assignment
- Newman projections
- chair conformations
- mechanism player with curved-arrow steps
- reaction-family knowledge graph

### Phase 3 — Biochemistry systems
- amino-acid ionization visualizer
- protein structure viewer
- enzyme kinetics simulator
- glycolysis + Krebs cycle interactive carbon tracing
- electron transport / chemiosmosis simulation
- pathway overlays: ATP, NADH, FADH2, carbon loss, fasting/fed state

### Phase 4 — Full learning platform
- Supabase authentication
- saved progress and mastery
- instructor/admin curriculum editor
- spaced repetition
- adaptive quizzes
- virtual labs
- content authoring and citations
- accessibility audit

## Tech direction

For a production version, a practical stack would be:

- Next.js / TypeScript
- Supabase / PostgreSQL
- A production molecular library such as 3Dmol.js for small-molecule visualization
- Mol* for proteins and macromolecular structures
- RDKit service for cheminformatics
- D3 for pathways / concept graphs
- KaTeX for math and chemical equations

## Renderer note

The prototype is fully self-contained and uses a small Canvas-based 3D renderer for the VSEPR models. For production-scale structures, surfaces, electron densities, proteins and imported chemical files, replace or augment it with a dedicated molecular visualization library such as 3Dmol.js or Mol*.
