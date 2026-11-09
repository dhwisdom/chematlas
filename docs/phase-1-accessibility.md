# Phase 1: keyboard interaction reliability

Branch: `fix/phase-1-accessibility`. Scope: Practice modal, mobile navigation, General Chemistry module/answer focus, and Learn semantics. No chemistry algorithms, scoring rules, storage formats, API handlers, Supabase integration, or Tutor behavior changed.

## Before / after evidence

The browser regressions were run against the unchanged baseline (`8813205`) before implementation: all four tests failed. The original audit interaction probe also reproduced focus loss independently. After implementation all four browser tests pass.

| Interaction | Baseline | After |
| --- | --- | --- |
| Open Practice with keyboard | Focus stayed on sidebar trigger; background controls reachable | Focus starts on Close; native modal excludes background |
| Tab / Shift+Tab at Practice boundaries | Background navigation reachable | Wraps between first and last enabled visible control |
| Open periodic reference over Practice, then Escape | Reference closed and returned focus correctly | Preserved: only reference closes; Practice stays open and its reference trigger regains focus |
| Escape / Close Practice | No intentional opener restoration | Original visible trigger restored; navigation control fallback if original trigger became hidden |
| Closed mobile sidebar | Controls still focusable offscreen | Sidebar is inert, including dynamically inserted controls |
| Mobile menu state / Escape | No expanded state; Escape left it open | Expanded/controls attributes, focus into drawer, Escape closes and restores menu focus |
| Route selection / viewport resize | Drawer state not synchronized | Route closure updates expanded/inert state; desktop navigation re-enabled; 800px menu available |
| Select another module | Focus fell to body | Focus moves to the selected module heading |
| Submit an assessment answer | Disabled submit control lost focus | Focus moves to explanatory feedback; next question still focuses its heading |
| First-answer evidence / resume | Existing behavior | Preserved: one answer event, disabled choices, no second submission, unfinished check resumes |
| Learn landmarks / semester selection | Two main elements, incomplete tablist | One main; labelled semester button group with pressed state |
| Lesson/course progress | Generic labelled divs without progress values | Named progressbars with current/min/max values and descriptive text |

Chromium axe scan after implementation reports only the existing contrast rule on desktop/mobile Learn and Practice. The former invalid ARIA/tablist and nested/duplicate-main findings are gone. Contrast is explicitly deferred; this stage does not claim WCAG conformance.

## Implementation boundaries

- Practice uses native `dialog.showModal()` and its cancel event, with explicit boundary Tab wrapping, preserved body overflow, and intentional opener restoration. The existing periodic-table native dialog remains unchanged.
- The mobile sidebar remains a nonmodal navigation disclosure. It exposes its state, moves focus inside on opening, makes closed content inert, and observes the existing route handlers' class-based closures. It does not trap focus while open.
- Module changes focus the new heading after rendering. Answer submission focuses the existing polite feedback region without altering scoring, first-answer locking, review eligibility, or event storage.
- Semester switching uses a labelled button group instead of a partial tabs implementation; active modules/routes expose current state. Reading-step progress is separate from completed-course progress.
- CSS changes are limited to adapting the existing overlay rule to native dialog sizing and aligning hamburger visibility with the existing 820px drawer breakpoint. No new global override layer.

## Run validation

The app has no package manifest. Keep browser/test dependencies outside the checkout. The browser test starts and stops its own local static server and implements the repository's clean-route rewrites. It blocks external requests and requires no account or API credentials.

```bash
# In the prepared cloud environment:
NODE_PATH=/opt/codex/cua_node/lib/node_modules \
CHROMIUM_EXECUTABLE=/usr/bin/chromium \
node --test tests/browser-accessibility.cjs

# Existing regression suites:
export NODE_PATH=/workspace/chematlas-devtools/node_modules
set -e
for test in tests/*.test.cjs; do node "$test"; done
for test in tests/admin-ui.cjs tests/dashboard-ui.cjs tests/learn-assessment-ui.cjs tests/periodic-ui.cjs tests/companion-ui.cjs; do
  node "$test"
done
```

Outside this environment, provide Playwright through NODE_PATH and either its installed Chromium or a system Chromium via CHROMIUM_EXECUTABLE. All four browser tests, 72 existing Node tests, standalone periodic-table assertions, and five existing UI scripts passed. Browser tests exercise real Enter, Space, Tab, Shift+Tab and Escape, module/answer focus, seven Practice engine entry points, nested reference return, and responsive drawer states. Existing mocked Learn tests cover all 19 modules and the full assessment/remediation lifecycle.

## Limitations and follow-up

- Validation used headless Chromium with external requests blocked. Live Supabase/Tutor calls, actual screen-reader announcements, and Safari/Firefox behavior were not verified.
- Native dialog and inert require modern browser support, consistent with the existing periodic-table dialog. Native modal exclusion is not represented by explicit inert attributes on the rest of the page.
- If opening Practice navigates away from a dashboard trigger or closes the mobile sidebar containing it, that trigger is no longer usable. Focus returns to the visible Practice navigation button or mobile menu instead of a hidden element.
- Existing contrast problems remain, including dark Practice panels with low-contrast text. Layout, text simplification, and comprehensive visual cleanup are separate work.
- **Next high priority:** fix false lesson-completion activity generated by empty completion-state writes. Preserve historical assessment evidence.
- **Next high priority:** simplify mobile Learn's introduction/course map/step hierarchy so the actual explanation appears sooner. Preserve every lesson, resource, engine, and Tutor entry point.

Merge and production deployment require explicit user approval. No merge or production deployment is part of this stage.
