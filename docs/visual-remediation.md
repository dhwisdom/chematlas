# Visual accessibility and layout remediation

Implemented from the supplied five-screen ChemWaypoint review brief, then verified against the actual app and computed styles. The attached screenshots are reference evidence, not a measured baseline; the comparison images below were captured locally before application changes.

## Baseline and review boundary

Branch: `fix/visual-readability`, based on Phase 1 commit `a6274f8`. At baseline inspection, remote main was `8813205`; PR #22's head matched Phase 1 and was not present in main. This branch preserves that commit without merging it. Review this as a stacked change against `fix/phase-1-accessibility` while Phase 1 is pending; retarget after Phase 1 is approved and merged.

No merge, deployment, database change, learner-data migration, chemistry-data change, assessment-algorithm change, or API-handler change is included. The false completion-activity/streak issue remains a separate high-priority task.

## Measured improvements

Computed sizes at a 2048px viewport unless noted. Widths are CSS pixels; reading measures remain constrained inside wider workspaces.

| Component | Before | After |
| --- | --- | --- |
| Main Courses / Learn / Practice content width | 1180 / 1120 / 1180 | 1440 / 1440 / 1440 |
| Tutor workspace / conversation width | 1280 / 742 | 1440 / 1176 |
| Landing supporting / flow-card copy | 14 / 10px | 18 / 17px |
| Navigation / course module chips | 13 / 10px | 16 / 14px |
| Learn course-map labels | 11px | 14px |
| Lesson body | 16px | 16px, with bounded reading measure |
| Model Lab help / property values | 10 / 13px | 14 / 17px |
| Practice tool labels / panel body | 12 / 16px | 14 / 17px |
| First Learn explanation panel at 390px | document y=1208 | document y=605 |

Sample contrast ratios calculated using WCAG relative luminance from resolved solid color pairs:

| Sample | Before | After |
| --- | --- | --- |
| Practice panel heading | `#17324a` on `#0d1c28`: **1.31:1** | `#17324a` on white: **13.19:1** |
| Shared secondary copy | `#7b8a94` on white: **3.56:1** | `#526873` on white: **5.86:1** |
| Practice correct feedback | Previously inherited mixed dark/light rules | `#245b36` on `#eaf6ed`: **7.20:1** |
| Practice incorrect feedback | Previously inherited mixed dark/light rules | `#8a302a` on `#fff2f0`: **7.57:1** |
| Primary control text | White on teal | White on `#0b7b79`: **5.09:1** |
| Input/control boundary | Inconsistent pale/dark borders | `#718992` on white: **3.69:1**, exceeding the 3:1 non-text target |

These samples are supplemented by browser axe scans, including rendered correct/incorrect states, not a claim that a handful of color calculations certifies the whole application.

## Changes by responsibility

**Foundation and style ownership.** Shared type, width and contrast tokens live in `shared-theme.css`. Removed redundant same-selector/same-condition declarations without relocating surviving cascade rules. Extracted Practice and Tutor styling from the tutoring shell into their existing component stylesheets; Model Lab presentation remains with its existing renderer/shell stylesheet. The tutoring stylesheet's `!important` count falls from **1,239 to 6**, reserved for hidden content and reduced-motion preferences. No additional stylesheet or global override generation was added. External Google font loading was removed in favor of the shared system fallback stack, avoiding font-swap layout changes.

**Courses and landing.** Wider responsive containers, larger copy, headings and controls. Course modules remain available through a native disclosure instead of a wall of tiny chips. General Chemistry completion still comes from learner state; static prototype completion percentages were removed from other course cards. Courses no longer incorrectly highlights Home. Course selector and breadcrumb reflect the current General Chemistry semester or Organic route.

**Practice.** Instructions, results and answer controls use readable light surfaces; the thermometer remains a scientific visualization. Tool navigation wraps, periodic layout scrolls within its own bounded scientific grid, and controls have clear focus/selected states. Added associated field labels, announced feedback and pressed states. All seven engines and their scoring/math are unchanged. Phase 1's native modal, Tab wrapping, background exclusion, Escape and nested reference behavior are preserved.

**Model Lab.** Fits projected atom positions to the live viewport with space reserved for atom radii. Coordinates, bond inference and angles are unchanged. Both stick and space-fill remain live renderings; pointer rotation and wheel zoom are preserved. Added visible keyboard-operable rotate/zoom/reset controls and selected-display semantics. Descriptive panels are light; only the visualization canvas remains dark.

**Tutor.** The conversation/composer receives the wider column. History and context/guidance are native disclosures, with compact history on narrow screens. Labels, prompts, messages and source/context text are larger. The permanent “Tutor live” decoration is replaced with unchecked/sending/last-request-success/unavailable status based on actual request outcomes. Thread storage, retrieval, citations, learner context, actions and API payloads remain intact.

**Learn and account affordances.** The course map is collapsed by default below 901px. Removed repetitive course-introduction and step-title chrome; the actual reading heading appears once. Goals, prerequisite/subtitle and lesson-specific Tutor help remain in a labelled disclosure. Step position and course completion retain distinct accessible progress semantics. Sidebar account/task controls are progressively disclosed; the existing account entry remains. Admin keeps its existing direct task controls.

## Before / after screenshots

[Open the side-by-side HTML gallery](visual-evidence/index.html). Click images there for full resolution. All captures use fresh guest state in Chromium, blocked external requests, and the same viewport sizes. They contain no live learner information.

| View | Before | After |
| --- | --- | --- |
| Landing, 2048px | [Before](visual-evidence/before-landing-2048.png) | [After](visual-evidence/after-landing-2048.png) |
| Courses, 2048px | [Before](visual-evidence/before-courses-2048.png) | [After](visual-evidence/after-courses-2048.png) |
| Practice, 2048px | [Before](visual-evidence/before-practice-2048.png) | [After](visual-evidence/after-practice-2048.png) |
| Model Lab, 2048px | [Before](visual-evidence/before-model-2048.png) | [After](visual-evidence/after-model-2048.png) |
| Tutor, 2048px | [Before](visual-evidence/before-tutor-2048.png) | [After](visual-evidence/after-tutor-2048.png) |
| Learn, 2048px | [Before](visual-evidence/before-learn-2048.png) | [After](visual-evidence/after-learn-2048.png) |
| Learn, 390px | [Before](visual-evidence/before-learn-390.png) | [After](visual-evidence/after-learn-390.png) |

[Machine-readable measurements](visual-evidence/measurements.json) retain before/after samples, overflow checks and axe results.

## Verification

- **42 responsive states:** six views at 320, 390, 768, 1440 and 2048px, plus 720 and 360px reflow widths representing 200%/400% of a 1440px workspace. No unintended document/dialog horizontal overflow or page errors. The periodic scientific grid intentionally has internal horizontal scrolling.
- **12 additional WCAG 2.2-tagged scans:** desktop 1440px and mobile 390px for all six views. No violations in the tested initial states, including target-size rules. The first responsive pass also identified and corrected residual demo/step-label contrast failures.
- **7 browser regression cases:** Phase 1 dialog, nested reference, drawer, focus and semantics; every molecule in both display modes at 1440 and 320px with atom bounds checked; keyboard/pointer/wheel rendering; mocked Tutor success/failure, follow-up payloads and persistent history; and representative results from all seven Practice engines.
- **Practice state scans:** correct/incorrect periodic choices, Lewis structures and balancing; stoichiometry results; acid/base and buffer calculations; equilibrium; calorimetry. WCAG 2.2-tagged scans pass. Representative correct answers clear all seven tools; first-answer assessment and resume rules remain separately covered.
- **Existing regression suites:** 72 Node tests, standalone periodic-table assertions, and five UI scripts pass. These cover all 19 lessons, assessment remediation/completion-versus-mastery, published content, role gates, synchronization contracts and Companion behavior with mocks.

### Reproduce

Tools remain external to the application checkout: Playwright 1.57.0, axe-core 4.11.0 and system Chromium. No package manifest or runtime dependencies were introduced.

```bash
export NODE_PATH=/opt/codex/cua_node/lib/node_modules:/tmp/chematlas-audit/node_modules
export CHROMIUM_EXECUTABLE=/usr/bin/chromium
node --test tests/browser-accessibility.cjs
VISUAL_ARTIFACTS=/tmp/chematlas-visual node tests/visual-readability.cjs
# VISUAL_WIDTHS=1440,390 selects a shorter scan; VISUAL_BASELINE=1 records measurements without enforcing remediation expectations.

export NODE_PATH=/workspace/chematlas-devtools/node_modules
set -e
for test in tests/*.test.cjs tests/admin-ui.cjs tests/dashboard-ui.cjs tests/learn-assessment-ui.cjs tests/periodic-ui.cjs tests/companion-ui.cjs; do
  node "$test"
done
```

The browser scripts start/stop their own local server with clean-route rewrites and block external requests. Screenshots and JSON reports are written to VISUAL_ARTIFACTS. Outside this prepared cloud environment, install these test tools in an external workspace and adjust NODE_PATH/CHROMIUM_EXECUTABLE.

## Limits and follow-up

- The 200%/400% checks are **equivalent CSS viewport reflow**, not automation of the browser's native zoom menu. Actual browser zoom, physical-device usability and screen-reader announcements still require manual acceptance testing.
- Live Supabase/auth/database and paid AI calls were not exercised. Their existing integration code is unchanged; browser Tutor requests were explicitly mocked. External fonts/CDNs were blocked during screenshot capture, so these images demonstrate the fallback/offline presentation.
- Axe success in these states is not a full WCAG conformance certification. Other routes and authenticated/published content variants may have additional accessibility issues.
- Intentional user zoom beyond the default model fit can enlarge atoms beyond the canvas; Reset restores the fitted view. Tests guarantee default bounds for all seven molecules in both modes at the tested widths.
- The false completion-activity event and the hardcoded guest streak remain separate data-state work. No history is rewritten by this visual change.
- Merge/deployment requires explicit approval. This review branch does not approve or merge Phase 1.
