# Learn task flow and product polish

Review branch: `fix/learn-task-flow`, based on progress-integrity commit `25d2268`. This is the second follow-up; no merge or deployment is included. The attached handoff was treated as task guidance under the user's implementation authorization, with production approval still reserved to the user.

## Findings and resulting behavior

1. **Trustworthy progress comes first.** The preceding branch fixes false completion/streak activity and isolates browser caches between accounts. See [progress-integrity.md](progress-integrity.md) for event/timezone/legacy retention policies. This branch does not alter that projection or the assessment engine.
2. **Learn had redundant step controls.** One step count/meter remains; direct numbered, titled steps are available through a closed native “Jump to step” disclosure. Choosing a jump closes it and focuses the revealed heading. Previous/Continue, saved positions, full module navigation, goals, resources, assessments and lesson Tutor help remain available. At 390px the reading panel starts at **y=564**, versus **605** before; at 1440px, **456** versus **497**. These are panel boundaries; the actual explanatory heading follows its normal padding.
3. **Startup routing could rebuild the lesson during interaction.** A delayed route retry and alias repair could repeat a successful ready-event navigation, destroying an opened step menu or resetting focus. Small guards in the existing adapters prevent duplicate reopening; aliases retain review/section query parameters. Courses tool launchers now use the existing navigation adapter, so the Organic/Model Lab view, URL and selected navigation agree.
4. **Availability and saved-state claims were overstated.** Courses distinguish available General Chemistry lessons, four Organic tools and planned course outlines. Removed prototype wording and misleading mastery language for the VSEPR quiz. Companion only claims every lesson completed when actual totals agree. Account sync distinguishes pending, successful and failed requests; fallback account/Tutor copy describes usable behavior. Guest carryover copy matches the progress branch's explicit first-sign-in policy.
5. **Organic and adjacent small text still needed work.** Organic instruction/control surfaces are light, with the scientific manipulation stage remaining dark. Canonical Organic styles own its palette, legends, controls and feedback. Meaningful secondary text is at least 14px in the touched areas. Fixed Companion muted contrast/checkbox target and account labels. Organic controls use pressed-state semantics. Removed redundant sidebar Tutor promotion while preserving navigation, topbar and lesson help. Text-presentation atomic glyph keeps existing branding consistent without replacing assets.

## Refactoring boundaries

- `chematlas-tutoring.js/css`: optional Learn navigation and shell presentation.
- `organic.js/css`: Organic presentation/pressed states; molecule data and scoring unchanged. Organic selectors were removed from tutoring CSS and moved to their existing component owner.
- `app.js`, `platform.js`, `platform-route-fix.js`: existing route adapters, honest course/account status and copy. No routing framework or architecture replacement.
- `companion.js/css`, `platform.css`, `task-views.js`, `styles.css`, `index.html`: local copy, availability and typography fixes.
- No new stylesheet, runtime dependency, global override bank or added `!important`; tutoring CSS remains at **6** declarations. No chemistry data, assessment scoring, server endpoints, database schema or RLS changes.

## Evidence and validation

[Before/after gallery](next-pass-evidence/index.html) includes Learn 390/1440, Courses/Practice/Tutor 1440, Organic, Companion, mobile menu and account states. [Computed styles and scan data](next-pass-evidence/measurements.json) include initial-state axe results. Before captures use the unchanged progress-integrity base; screenshots use local Chromium, clean guest/fixture states and blocked external requests.

- **83 Node cases**, standalone periodic-table assertions and **five jsdom UI scripts** passed. Added Companion assertions for missing recommendation versus actual all-lesson completion.
- **13 Chromium browser cases passed**: Phase 1 focus containment/background exclusion/Escape/opener restore and nested reference; mobile hidden navigation/resizing; module/check focus and first-answer locking; all seven Practice engines/results; every Model Lab molecule/both modes and pointer/keyboard controls; Tutor mocked success/failure/history; progress event/account isolation; all **19 lessons**, keyboard Previous/Continue/jumps, section/review/alias/resume links; Organic four-tool selected states and correct/incorrect stereo results.
- **42 responsive states passed**: six primary views at 320, 390, 768, 1440, 2048, 720 and 360px. No unintended document/dialog overflow or page errors. The last two widths approximate 200%/400% reflow from 1440px.
- **8 additional states passed**: Organic, Companion, account and menu at 1440/390px. WCAG 2.2-tagged axe scans pass for tested initial desktop/mobile states and tested Practice/Organic result states. Browser checks drive real keyboard interaction in headless Chromium; they do not replace screen-reader acceptance testing.
- `git diff --check` passed. Test tools remain external; reproduce using commands in [visual-remediation.md](visual-remediation.md). Additional views: `VISUAL_VIEWS=organic,companion,account,menu VISUAL_WIDTHS=1440,390`.

The first wider scan exposed existing Companion contrast/target and 11px account labels, which were fixed in their owners. New interaction tests reproduced both delayed lesson rebuild and the Courses→Organic URL defect before their fixes. The resize test now waits for the browser media-query event before asserting inert state; no arbitrary sleep is used for that assertion.

## Review and release limits

Remote main rechecked at `8813205ee8d3b848e5ad30c7cc26733ac04fef93`; readability remains `f207df0`, progress integrity `25d2268`. GitHub API requests return Forbidden, so current PR state and automated PR creation cannot be confirmed. The supplied Vercel preview fails at proxy CONNECT with HTTP 403; no preview application response, green build or deployment validation is claimed. Branches are pushed for review, with comparison links in [next-pass-review.md](next-pass-review.md).

Review order: Phase 1 (reported PR #22) → visual readability → progress integrity → Learn task flow. Recheck remote refs and validate an authorized preview before approving each merge. No production merge/deploy, live student account, paid AI request or email sending was performed.

Native browser zoom, screen-reader announcements, Safari/Firefox and physical-device acceptance remain untested. Width-based reflow is not native zoom. Axe only covers the exercised states, not full WCAG conformance. Existing account custom-overlay focus containment is outside this narrow polish pass; its initial-state scan does not certify its entire keyboard flow. The browser-only legacy checkpoint/recovery policy and live cloud integration limits remain as documented in the progress report.
