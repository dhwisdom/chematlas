# Responsive mobile review

## Scope and release boundary

This development pass extends the **same ChemWaypoint website** for phones and tablets. It does not create a separate mobile application or change the legacy mobile redirect.

- Base: `integration/review-baseline`, commit `31c261ff818895e231cbabeb759a29a2745f80f6`.
- Development branch: `feat/mobile-responsive-review`.
- No production pushes, merges, deployments, Vercel dashboard setting changes, database changes, external emails, or paid API requests. The exact feature branch is disabled for automatic Git deployments in `vercel.json` before publication.
- Account, Tutor, Companion and learner-state schemas, storage keys, endpoints and synchronization logic remain unchanged.

## Changes

- Mobile navigation now has a visible Close button, an outside-tap backdrop, contained keyboard focus, background inert state, scroll locking, and safe-area spacing. Native disclosure summaries remain in the focus loop.
- Dismissal, routes, Back/Forward and desktop/mobile breakpoint changes clear the drawer state. When the mobile menu or Close control disappears on desktop, focus moves to visible navigation. Opening account or periodic-reference surfaces first dismisses the drawer. Closing a periodic reference whose drawer trigger is inert returns focus to the visible menu opener.
- The existing global concept search moves into the mobile drawer and back to the desktop header. It is one control with the same search behavior, not a duplicate. Focus is retained on desktop relocation, or returned to the mobile menu if search moves into the closed drawer.
- Phone landing content uses a single-column hero.
- Tutor phone spacing and empty-state height are reduced. The question field stays in document flow and uses 16px input text. This avoids introducing a fixed composer that might overlap the on-screen keyboard.
- Companion phone tabs/buttons have 44px minimum height. Practice footers and compound facts stack on narrow screens, and input text is 16px.
- Learn semester tabs have 44px minimum height.

## Branch and hosting facts checked 2026-11-10

GitHub has both `main` (`8813205ee8d3b848e5ad30c7cc26733ac04fef93`) and `mobile` (`96bae7c6567f5d02466e792e680924382e841744`). Branch existence alone does not mean both are production sources.

Vercel has `chematlas` and `chematlas-mobile` projects. The former owns `www.chemwaypoint.com` and `chemwaypoint.com`; the latter retains its old Vercel aliases. The latest three recorded production deployments in **both** projects came from `main`. Their latest production commit is `8813205`:

- [Main project production deployment](https://vercel.com/thetruedaltino-3388/chematlas/FnV1xc3VGD2MtUCJBLxpMPcqcA7f)
- [Legacy mobile project production deployment](https://vercel.com/thetruedaltino-3388/chematlas-mobile/6Hdyc28u5ybvYCCbPhdTmNBgRqiV)

The project-details response did not expose the configured Production Branch field. Therefore current deployment history is verified; that exact dashboard setting is not. Do not assume a push to `mobile` is safe based on its name. Feature-branch publication uses the explicit `feat/mobile-responsive-review: false` Git deployment guard in `vercel.json`; it does not publish a website or change either production branch.

## Verification

Passed in the isolated development checkout:

- `npm ci` with a writable temporary npm cache, Node 24.22.1.
- `npm test`: **117 passed, 0 failed**. This includes the new mobile-navigation DOM regression and all existing tests.
- `npm run build`: guarded **mock** build.
- `git diff --check`.
- Focused code review of drawer, routing and search changes.

**Rendered browser acceptance is blocked, not passed.** System Chromium failed before opening a page because this execution environment disallows its process-singleton Unix socket. The supported Playwright headless-shell installer returned an invalid/empty archive. A separate cloud browser could not reach the isolated localhost server. No screenshots or rendered viewport results were produced in that cloud environment. DOM tests do not prove actual layout, native inert, touch behavior or mobile keyboard behavior.

The local real-database integration suite was not rerun here because no Docker executable is available. This pass does not change backend or data logic. Previous integration results for the base commit are not results for this commit.

## Browser acceptance to run before approval

On a supported development computer, from this branch:

```text
npm ci
npx --no-install playwright install chromium
npm test
npm run test:browser
npm run test:accessibility
npm run test:mobile
npm run build
```

Use `CHROMIUM_EXECUTABLE_PATH` for `test:mobile`/`test:browser` or `CHROMIUM_EXECUTABLE` for accessibility when using an existing Chromium installation.

The new `test:mobile` uses the guarded mock server, blocks external requests and exercises widths **320, 390, 430, 768, 820, 821 and 1440px**, short-viewport drawer dismissal, phone search, focus and breakpoint recovery, synthetic sign-in at 390×844, simulated Tutor/Companion chat and five-answer practice. Its Back/Forward check enters the dashboard through the actual landing-page SPA control and asserts the same document time origin through both history transitions. It does not substitute a full-page reload for popstate coverage. It writes screenshots during the run and a report on successful completion to ignored `.local/mobile-evidence/`. The workflow runs it alongside the existing browser suite.

Also review on a physical iPhone/Safari and Android/Chrome:

1. Open and dismiss the menu with touch; scroll to the last account disclosure. Rotate the phone while open.
2. Search for Measurement, continue the lesson, expand contents/goals, and use Back/Forward.
3. Sign into a local synthetic account, sign out, and switch between the two synthetic learners.
4. Type a longer Tutor and Companion question with the software keyboard open. Confirm the input and submit control remain reachable.
5. Complete Companion practice and inspect a long compound name/SMILES. Check the periodic table's intentional internal horizontal scroll.
6. Recheck desktop layout and keyboard-only use.

No production release should be inferred from these changes or the passing DOM/unit tests. Browser acceptance and review are still required.

## Known pre-existing account-overlay follow-up

Independent review found that the existing account overlay (`platform.js`, `#caAccountOverlay`) is an ordinary div without modal semantics, focus transfer/containment or Escape handling. Its modal also lacks a viewport height limit and internal scroll containment, which can make a 390×430 viewport difficult to use. Closing the new drawer before opening this existing overlay does **not** fix that underlying behavior, and automated fill/click sign-in is not evidence of keyboard accessibility.

This patch leaves account rendering and authentication behavior unchanged. A separate focused overlay change should use native dialog behavior or an equivalently tested modal pattern, restore focus to a visible opener, contain background interaction, and keep content scrollable above the software keyboard. Verify sign-in, signup, sign-out, account switching, close/Escape and interrupted flows with a real browser and physical devices. Treat this as an open accessibility issue before claiming the full mobile experience is complete.

## Safe Git publication

The feature branch carries `git.deploymentEnabled["feat/mobile-responsive-review"] = false` from its first published commit, while retaining the existing disabled integration branch. [Vercel documents this branch-specific control](https://vercel.com/docs/project-configuration/git-configuration) as disabling automatic deployments. No enabled glob conflicts with either guard. The repository has only its root `vercel.json`, and its GitHub workflow has no push trigger. Publication does not create a PR, dispatch CI, or request a Vercel deployment. Manual deployment or removing the guard would require a separately approved action.

When publishing through GitHub Git-data tools, create an unreferenced commit with the guarded final tree, compare its tree SHA against the locally tested tree, and only then create the new feature branch pointing directly to that guarded commit. Do not temporarily create the feature branch from an unguarded base. The published commit may have different metadata/SHA from the local development commits; verify tree identity rather than assuming commit identity.

## 320px dashboard correction

Windows validation of published commit `9fd68a8` reported accessibility **34/34** and mock-browser **27/27** passing. The mobile suite then stopped at `/dashboard`, 320px wide: document scroll width was 346px because the dashboard's secondary column retained a 310px desktop minimum.

The later desktop declarations overrode the earlier responsive rules. The correction places dashboard/Continue-card breakpoints after their desktop definitions, allows nested grid items to shrink, and wraps phone metadata and footer actions. Two CSS cascade regression tests fail on the old rules and pass with this correction; they are structural tests, not rendered layout evidence. The mobile browser test now also checks stacked columns and dashboard card bounds. The corrected snapshot still needs a Windows mobile-suite rerun; the earlier Windows passes do not validate this new snapshot.

## Development warning stacking correction

Windows mobile validation of `0087539` passed the 320px route/containment checks, then found the development warning intercepting clicks on the drawer Close button. Its original inline `z-index:9999` sat above the fixed navigation. The warning now keeps its text, colors and normal page-flow position at a low stacking level, beneath navigation and modal overlays. It is not hidden or removed, and production mode still creates no warning. As with other page content, the open drawer temporarily covers part of it.

A DOM regression fails on the old stacking value and covers mock, test and local modes; a separate test checks that production adds no warning. Browser acceptance also checks the warning is visible/uncovered before and after drawer dismissal, and that the Close control receives the center-point pointer hit. The updated browser assertions require a Windows rerun; DOM style checks alone do not prove pointer behavior.

## Breakpoint focus ordering correction

Windows mobile validation of `4a05feb` reached the desktop-to-phone search resize, where focus fell to the document body rather than the menu. An obsolete mobile `display:none` rule hid the desktop search before its breakpoint handler could move it. The search now stays rendered until that handler relocates it; the closed drawer still excludes it with native inert. Navigation also moves focus out of a closing sidebar before setting inert, rather than inspecting focus after the browser may already have cleared it.

The CSS regression and an immediate-inert-blur DOM simulation both fail on the previous implementation. Browser acceptance repeats search relocation in both directions and checks that one search control remains. Native browser confirmation of this correction is still pending.
