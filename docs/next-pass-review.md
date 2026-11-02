# Follow-up review queue

No merge or production deployment is authorized by these branches. Remote main was still `8813205` at the final check. Current GitHub PR state could not be read because the API returned Forbidden.

## 1. Progress integrity

- Head: `fix/progress-integrity` (`25d2268ddafa33021340186005ed9efc286b3e6e`)
- Base: `fix/visual-readability` (`f207df0`)
- [Open exact comparison / prepare PR](https://github.com/dhwisdom/chematlas/compare/fix/visual-readability...fix/progress-integrity?expand=1)
- Suggested title: **Fix false learning activity and isolate browser account progress**

Navigating lessons previously wrote a “lesson completed” history row containing `[]`, with zero assessment events and a hardcoded one-day streak. Activity/streaks now derive from validated finished assessment runs; explicit scientific Practice submissions remain separately labelled. Existing legacy history is retained and displayed as unverified rather than silently rewritten.

Browser-only guest/account checkpoints and session-epoch guards prevent delayed cloud/Tutor responses and account switching from mixing learner data. First explicit guest sign-in can claim guest work once; ambiguous restored legacy data remains retained in a guest checkpoint. No database/API/scoring changes.

Validation: 83 Node cases, standalone periodic-table assertions, five jsdom scripts and 11 browser cases passed on this branch. [Policy and limitations](progress-integrity.md), including legacy recovery and timezone behavior; [before/after state evidence](next-pass-evidence/progress-before.json). Final stacked branch expands browser coverage to 13 cases.

## 2. Learn task flow and product polish

- Head: `fix/learn-task-flow`
- Base: `fix/progress-integrity` (`25d2268`)
- [Open exact comparison / prepare PR](https://github.com/dhwisdom/chematlas/compare/fix/progress-integrity...fix/learn-task-flow?expand=1)
- Suggested title: **Simplify Learn step navigation and clarify course availability**

Learn now uses one step count/meter, Previous/Continue and an optional closed jump disclosure. All 19 lessons, checks, resources, resume/deep links and Tutor help remain available. Mobile reading begins at y=564px instead of605px. Fixed duplicate delayed route reopening and Courses tool URL mismatch discovered by keyboard tests.

Clarifies available lessons versus Organic tools and planned outlines; removes misleading mastery/completion/sync copy. Organic component owns its readable instruction/control palette, selected states and dark scientific stage. Corrected Companion contrast/targets and account labels; removed redundant Tutor promotion. No added stylesheet or override bank; tutoring `!important` count stays6.

Validation: 83 Node cases, standalone periodic-table assertions, five jsdom scripts, 13 Chromium interaction cases and 50 responsive states passed. WCAG2.2-tagged axe scans pass in covered initial/result states. [Full change rationale and limits](learn-task-flow.md); [before/after screenshot gallery](next-pass-evidence/index.html).

## Release blockers and order

Review Phase1 → readability → progress integrity → Learn task flow. The supplied Vercel preview is blocked by a proxy CONNECT403; no green preview is claimed. Validate authorized branch previews before release. Native zoom, screen readers, other browsers and live integrations remain acceptance tasks. GitHub API access is Forbidden; comparison URLs are not invented PR numbers. No branches were merged or deployed.
