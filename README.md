# ChemAtlas — Interactive Chemistry Learning Platform

ChemAtlas is a learner-first chemistry platform that connects a college chemistry sequence to original learning material, interactive models, reasoning-first practice, progress analytics, and course-grounded AI tutoring. The goal is to help learners move from **atomic structure → bonding → organic chemistry → physical chemistry → biochemistry** without losing the conceptual links between courses.

**Production site:** `https://chematlas-red.vercel.app/`

See `PRODUCT_ARCHITECTURE.md` for the product North Star, learner capabilities, data model, AI approach, governance principles, and outcome measures.

## Product experience

### Learner-first platform layer
- Dedicated first-visit landing experience rather than dropping new learners into a tool dashboard
- Goal-based onboarding for foundations, Organic Chemistry preparation, General Chemistry II review, and Biochemistry preparation
- Adaptive next-step recommendations based on learning goal and current local/cloud mastery state
- **My Progress** center with module mastery, practice-engine mastery, VSEPR score, active practice days, and recent learning activity
- Practice-history instrumentation built around meaningful mastery events rather than page-view vanity metrics
- Clean Vercel URLs such as `/dashboard`, `/progress`, `/tutor`, `/organic`, and `/genchem/:module`
- Useful guest mode using browser storage; profiles add continuity rather than gating the learning material
- Supabase-ready profile and cross-device synchronization layer
- Course-grounded **ChemAtlas AI Tutor** UI with optional web context

### Curriculum + platform shell
- Dashboard with a prerequisite-oriented chemistry pathway
- Four-year curriculum map based on the **University of Arkansas 2026–27 B.S. Chemistry with Biochemistry concentration**
- Course library with General Chemistry I, General Chemistry II, Organic Chemistry I/II, and Biochemistry scaffolds
- PostgreSQL/Supabase-ready normalized data model in `schema.sql`
- Responsive architecture deployed through Vercel from GitHub `main`

### General Chemistry Foundations — learning + modeling
- Full two-semester **General Chemistry Foundations** reader with 19 modules
- Original learning material covering measurement, atoms/moles, formulas, stoichiometry, aqueous chemistry, thermochemistry, electronic structure, periodicity, bonding, molecular geometry, gases, intermolecular forces, solutions, kinetics, equilibrium, acids/bases, solubility, thermodynamics, and electrochemistry
- Every module includes learning objectives, concept explanations, core equations, a worked example, vocabulary, a course-connection note, and an auto-checked mastery question
- Searchable module navigator and Gen Chem I / Gen Chem II semester switcher
- Lab-connection callouts and explicit prerequisite/transfer links into later chemistry courses
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

### Organic Chemistry Studio
- **R/S stereochemistry trainer** with CIP priorities, wedge/dash bonds and multiple challenges
- **Newman projection explorer** for butane with a rotatable C2–C3 dihedral angle, conformation labels and approximate relative-energy profile
- **Cyclohexane chair-flip explorer** showing axial/equatorial interchange, 1,3-diaxial contacts and substituent size effects
- **Curved-arrow mechanism trainer** for an SN2 reaction, enforcing the rule that arrows begin at electron pairs or bonds
- Expanded Organic Chemistry I curriculum modules and an Organic Chemistry II course scaffold

## AI Tutor architecture

`api/tutor.js` is a Vercel server-side endpoint using the OpenAI Responses API. The browser performs lightweight retrieval over ChemAtlas course material, sends only the most relevant course context plus the learner question to the endpoint, and asks the tutor to teach from ChemAtlas context first. The learner can optionally allow web context for current or external information.

The OpenAI API key must exist only as the Vercel server-side environment variable `OPENAI_API_KEY`. It must never be committed to GitHub or placed in browser configuration. `OPENAI_MODEL` is optional; the current endpoint defaults to `gpt-5.6-luna`.

Until `OPENAI_API_KEY` is configured, the AI Tutor surface remains visible and explains that server configuration is still required instead of breaking the rest of the site.

## Profiles and cross-device progress

ChemAtlas uses a guest-first state model. Learners can use all current learning content and practice tools without an account. Progress is stored locally in the browser.

When the dedicated ChemAtlas Supabase project is configured, `data/platform-config.js` will contain only the public Supabase project URL and publishable key. Signed-in learners can then merge and synchronize the same state through the `learner_state` table. The schema also includes normalized tables for profiles, lesson progress, practice attempts, tutor threads, and tutor messages.

Row Level Security policies in `schema.sql` restrict learner-owned tables to `auth.uid() = user_id`. Service-role keys and other secrets must not appear in browser code.

## Clean routing

Vercel rewrites in `vercel.json` keep the current static architecture while providing product-like URLs:

```text
/                         first-time / public landing
/dashboard                learner dashboard
/curriculum               degree map
/courses                  course library
/progress                 learner mastery + history
/tutor                    ChemAtlas AI Tutor
/model-lab                VSEPR model lab
/genchem                  General Chemistry Foundations
/genchem/:module          individual Gen Chem module
/organic                  Organic Chemistry Studio
```

Friendly General Chemistry aliases are canonicalized to the actual course module IDs so saved/deep links remain stable.

## Academic grounding

The degree sequence is modeled on the University of Arkansas 2026–27 B.S. Chemistry with Biochemistry concentration. It includes general chemistry, analytical chemistry, organic chemistry I/II, physical chemistry I/II, biochemistry, genetics, biochemical techniques and instrumental analysis.

ACS curriculum guidance is used as a second design constraint: introductory chemistry should lead into breadth across analytical, biochemistry, inorganic, organic and physical chemistry. ASBMB's core-concept framing is a future constraint for the biochemistry branch, especially energy/metabolism, structure/function, information flow and quantitative scientific skills.

The General Chemistry sequence is an original ChemAtlas instructional design aligned to the UArk degree/course context, ACS introductory-chemistry expectations, and the common two-semester scope represented by OpenStax Chemistry 2e. It is **not** a reproduction of or substitute for an official University of Arkansas syllabus. Learning text and worked examples in ChemAtlas are original content.

## Run locally

The current release intentionally keeps the learning client framework-light while Vercel supplies the server-side tutor route.

```bash
python -m http.server 8000
```

Static learning features work locally. The `/api/tutor` endpoint requires a Vercel-compatible server environment and the `OPENAI_API_KEY` environment variable.

## Architecture

```text
Program / degree spine
  └── Courses
       └── Modules
            └── Lessons
                 ├── Concepts + prerequisites
                 ├── Visualizations
                 └── Assessments

Learner
  ├── Goal / preferences
  ├── Mastery + progress
  ├── Practice attempts
  ├── Adaptive next step
  └── Tutor history

ChemAtlas Tutor
  └── relevant course context → server-side OpenAI response → optional web context
```

## Current build priorities

General Chemistry remains the platform’s prerequisite backbone. The next depth upgrades should add larger randomized problem banks, limiting-reactant and percent-yield modes, weak-acid/base equilibrium practice, titration curves, solubility-product simulations, kinetics data fitting, cumulative unit exams, and richer virtual-lab datasets before later courses are treated as complete.

The next platform milestones are to activate the dedicated Supabase project, turn cloud sync on, configure the Tutor API key in Vercel, deepen practice-event analytics, and then build the Biochemistry systems layer: amino-acid ionization, proteins, enzyme kinetics, glycolysis/Krebs carbon tracing, and electron transport/chemiosmosis.

## Site administration

Open `/admin` and sign in with a verified ChemAtlas account. Admin membership is held in `public.site_admins`, which browser sessions can read only for themselves and cannot modify. A trusted project owner must assign the initial admin role after checking the account email and verification status. There is no public admin signup or first-user promotion.

The editor supports sidebar tab labels/order, adding and editing General Chemistry modules and reading sections, worked examples, quick checks, private drafts, previews, publishing, and loading earlier published versions as drafts. Existing module IDs are immutable in the editor so progress stays connected. Publishing overlays the bundled course without replacing its source files. If published content is unavailable or invalid, the bundled curriculum remains usable.

`site_drafts` and `site_revisions` require the corresponding component right. `site_published` exposes published content to learners. Save/publish RPCs use invoker permissions, RLS, and optimistic version checks. No service-role key is used by the editor. Admin does not grant access to other learners' progress or Tutor history.

`shared-client.js` provides one Supabase client for account, Tutor, and editor sessions. The additive migration also ensures the existing learner-state and Tutor tables are available, retaining their owner-based policies.

Validation:
- `node --test tests/content-store.test.cjs`
- `tests/admin-permissions.sql` through a trusted SQL connection: tests RLS, draft privacy, write denial, self-promotion denial, publication, version conflicts, and history inside a rolled-back transaction.

To assign an administrator, resolve the exact confirmed email in `auth.users` and insert that user's UUID into `public.site_admins` through a trusted database operation. Never infer the account from the first signup, and never expose role assignment in public signup metadata.


### WebCenter 25.03-style workspace

Reference: [Esko WebCenter 25.03 Administration Guide](https://docs.esko.com/docs/en-us/webcenter/25.03/quickstartguide/pdf/WebCenter_AdministrationGuide.pdf), Menu Builder pp.39–40, Dashboard Builder p.85, Groups/Rights pp.274–275. ChemAtlas adapts the gallery/canvas/properties interaction and group component rights; it is not an Esko integration.

- **Menus:** reorder/rename the six core tabs, add/remove shortcuts to supported ChemAtlas routes, preview and publish. Core tools remain accessible.
- **Dashboards:** reorder learning widgets, set one/two columns and full/half width, hide optional widgets, add announcements and shortcuts. Continue learning is retained. The original home layout remains active until a dashboard is published.
- **Users & groups:** verified-account picker, group names, component rights, add/remove memberships. Changes apply immediately; account creation and email confirmation remain in Supabase Auth.
- **Rights:** menus, dashboards, content, publish, access. Publishing requires both the component right and publish. Access managers can grant any delegated right. Existing `site_admins` membership is protected owner access and remains assignable only through trusted database operations.
- **Privacy:** group administration exposes only verified account email/ID and owner status, never learner progress or Tutor conversations. Private authorization helpers avoid recursive membership RLS and bind checks to `auth.uid()`.
- Three starter groups have no members: Content editors, Site designers, Publishers.

Apply `supabase/migrations/20261003180310_webcenter_admin_workspace.sql` before deploying these UI files. Run `tests/group-permissions.sql` against a trusted SQL connection (transactional fixtures roll back). `tests/admin-ui.cjs` exercises the editor with a mocked client; install `jsdom@26.1.0` in an external test workspace and supply its `node_modules` via `NODE_PATH`.


### Periodic table reference

The sidebar, Learn checks, and Practice Lab open a native modal reference without navigating or modifying progress/answers. Includes 118 elements, search and family filtering, introductory ion names/charges, and common polyatomic ions. Native dialog behavior traps focus; Escape closes only the reference and focus returns to its trigger. Small screens use horizontal table scrolling with searchable results as an alternative.

Element facts in `data/periodic-table.js` come from NIH PubChem's `https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON` (2026-10-03); standard atomic weights use the CIAAW 2024 abridged table with uncertainties, and elements without an assigned standard weight show a dash. Display layout uses detached La–Lu and Ac–Lr rows. Naming guidance follows OpenStax Chemistry 2e §2.7. Oxidation states are explicitly distinguished from simple-ion charges. All three sources are linked in the reference.

Validation: `node tests/periodic-table.test.cjs`; `tests/periodic-ui.cjs` with jsdom 26.1.0 supplied through NODE_PATH.
