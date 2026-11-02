# Five focused fixes

Base: `fix/learn-task-flow` at `78f9686bcb4724902b15a4ceba6f6414d8a24d79`. Isolated review branch: `fix/account-resources-companion-streak`; stacked PR base remains `fix/learn-task-flow`.

The attached v2 brief and four screenshots guided this implementation; the user's instructions authorize implementation and review, while withholding merge/production approval. The later clarification explicitly authorizes mocked integration tests, leaves production Supabase configuration and CORS unchanged, and defers authenticated live testing until a staging backend/test-account workflow exists.

## Reproduction and changes

1. **Account form:** local Chromium confirmed the higher-specificity legacy rule won: input background `rgb(7,20,30)`, white text. The canonical `platform.css` rule now owns the light surface, navy text, field boundary, placeholder, focus, disabled, invalid and autofill states, excluding checkbox/radio inputs. Removed the competing tutoring input rule. Create-account testing also reproduced its confirmation message disappearing on rerender; the message now survives in a live status region. Existing sign-in/sign-up SDK events are preserved.
2. **Lesson resources:** computed styles confirmed the bridge's dark gradient and descriptions `#9eb3bf`. `genchem.css` now owns light resource/vocabulary/reference styling and readable muted descriptions. Removed competing tutoring declarations instead of adding an override layer. Checking signed-in resources and visible worked examples exposed a completed badge at 4.43:1 and amber example label at 3.62:1; corrected their existing owner rules. All 19 modules retain their lesson content, links, disclosures and example answers.
3. **Companion:** a simulated fetch rejection reproduced the raw “Failed to fetch” status. Requests now distinguish exposed 401/403/404/server errors, unexpected responses, timeout and network rejection, with safe public messages. Practice failures have a local recovery panel, Retry, and account/reconnect actions. Same-account reconnect uses the existing SDK's refreshSession where available. Retry retains the requested lesson and first-answer payload; final answers become immutable when submission is attempted and are resent with the same session ID. Recovery/new questions/saved result receive meaningful keyboard focus. Invalid or failed responses create no completion. Cross-account epoch/abort guards remain, including an extra guard after asynchronous session lookup. Data remains in the current tab and intentionally clears across account changes; reload recovery is not newly added.
4. **Streak:** empty state is a restrained “Start your streak” cue, with no dash/count/amber icon. Active verified streaks retain the existing projection and use an aligned single-line count/label. Tooltips reflect the actual state. The existing compact mobile header continues to hide this metric. No dates, streak rules, events or mastery logic changed.
5. **Search:** removed the shortcut badge, its CSS and Ctrl/Meta+K interception/default cancellation. Normal search, result routing, focus indication, Tab access and Escape dismissal remain. Existing narrow-screen search visibility is preserved; no new mobile search redesign is included.

No chemistry engines/data/scoring, backend handler, API payload contracts, RLS, database schema or production configuration changed. No stylesheet or runtime dependency was added; tutoring CSS retains 6 `!important` declarations. Component styles were edited in place and competing declarations removed.

## Companion diagnosis: evidence versus uncertainty

- The repository's public configuration points at `https://zslxoqvqxdqwykzdogor.supabase.co/functions/v1/chemwaypoint-site-companion`. The configuration actually served by a deployed preview could not be inspected.
- The current handler only admits the two canonical production origins. The supplied Vercel preview hostname is absent. Unit tests show its preflight returns 403 before adding `Access-Control-Allow-Origin`, without downstream authentication or data requests.
- A standalone local browser fixture with CSP restricted to the local test backend exercises the unchanged bundled handler: **OPTIONS 403, no allow-origin header, browser `net::ERR_FAILED`, no authenticated POST reaches the server**. This confirms the proposed CORS mechanism for an unapproved origin. DevTools interception suppresses ordinary preflight, so this test deliberately uses a separate CSP-bounded, non-intercepted local page with fixture credentials.
- Read-only production/preview HEAD requests and a token-free Supabase OPTIONS probe all fail at the environment proxy's **CONNECT 403**. These are proxy responses, not application/Edge Function responses. No service outage, deployed function 404 or live authentication failure is established.
- Therefore CORS is a strong conditional explanation **if the screenshot came from that preview using this handler**. An offline/blocked request, absent function, expired session or upstream error cannot be excluded for the actual screenshot. JavaScript cannot reliably distinguish CORS from other network-level rejection; its message correctly stays general. Exposed HTTP auth/service statuses and client timeout have separate recovery messages.
- No origin broadening, wildcard/reflection, production configuration change or backend deployment is included. The user confirmed there is no approved separate staging backend or non-production account yet.

## Validation and evidence

[Before/after gallery](five-fixes-evidence/index.html) · [computed styles/axe data](five-fixes-evidence/measurements.json) · [local preflight trace](five-fixes-evidence/companion-preflight.json).

Measured colors after correction:

| State | Foreground/boundary | Surface | Contrast |
| --- | --- | --- | --- |
| Account text | #17324a | #fbfcfa |12.82:1|
| Account boundary | #718992 | #fbfcfa |3.58:1|
| Resource description | #526873 | #fbfcfa |5.69:1|
| Completed badge | #286347 | #eaf4ed |6.29:1|
| Example label | #80551e | #fbf3e5 |5.89:1|

These measurements and axe checks cover exercised states; they are not full WCAG certification.

Final execution: **85 Node cases** (the previous 83 plus 2 CORS regressions), standalone periodic-table assertions, **five UI suites**, and **21 Chromium cases** (the previous 13 plus 8 focused cases) passed. The browser suite covers account typing/masking, Tab/focus, sign-in/create-account events, forced autofill, invalid/disabled states, all 19 expanded resources and worked examples, normal search/shortcut non-interception, verified streaks, Companion success/failure/retry/reconnect, immutable save payloads, and real local preflight rejection. Existing Practice/reference/mobile drawer/Tutor/model/account-isolation regressions remain covered.

**42 existing responsive checks plus 21 focused checks** passed. Learn states overlap between the matrices; these are execution counts, not 63 unique screens. Focused checks cover 320/390/768/1440/2048px and 720/360px reflow, with axe at each width; Companion error panels also pass at the five requested widths. No covered axe violations, unintended document overflow or page errors remained. Syntax and `git diff --check` passed. [Verification record](five-fixes-evidence/verification.json) · [browser results](five-fixes-evidence/browser-results.txt).

During development the broader scans failed on the completed badge and worked-example label before their correction. One existing assessment reload test failed in the parallel run and passed in isolation; it now waits for the existing application ready state after reload, matching normal setup, and the final full suite passed. No assessment code was changed to resolve that test timing.

Reproduce using the external test tools already documented in [visual-remediation.md](visual-remediation.md):

```bash
NODE_PATH=/workspace/chematlas-devtools/node_modules node --test tests/*.test.cjs
NODE_PATH=/opt/codex/cua_node/lib/node_modules:/tmp/chematlas-audit/node_modules \
CHROMIUM_EXECUTABLE=/usr/bin/chromium FIVE_EVIDENCE=/tmp/five-evidence \
node --test tests/browser-accessibility.cjs
VISUAL_VIEWS=account,resources,learn VISUAL_WIDTHS=320,390,768,1440,2048,720,360 \
VISUAL_SHOTS=all VISUAL_AXE_ALL=1 VISUAL_ARTIFACTS=/tmp/five-responsive \
NODE_PATH=/opt/codex/cua_node/lib/node_modules:/tmp/chematlas-audit/node_modules \
CHROMIUM_EXECUTABLE=/usr/bin/chromium node tests/visual-readability.cjs
```

`FIVE_BASELINE=1` captures diagnostic baseline states without enforcing fixed-style assertions; it is not a passing remediation test. Before screenshots come from the unchanged base worktree. The tests block external requests; the standalone CORS fixture instead uses CSP allowing only its local backend and has no real account credentials. Artifacts never record authorization/cookie headers.

## Review

[Exact stacked comparison / prepare PR](https://github.com/dhwisdom/chematlas/compare/fix/learn-task-flow...fix/account-resources-companion-streak?expand=1). Base remains `fix/learn-task-flow`; GitHub API access is Forbidden, so no PR number is invented.

## Remaining acceptance work

- Establish an approved staging Supabase project/function and non-production test account, with an explicitly approved exact preview origin. Validate real OPTIONS headers, deployed function status, authenticated create/submit, expired sessions, reconnection and account isolation there. Do not use production learners for write tests. A frontend Vercel preview alone is not an approved staging backend.
- Verify the new branch's Vercel preview commit/build independently and perform frontend review where accessible. The only supplied preview URL belongs to the prior stack: `https://chematlas-qwhf9cquo-thetruedaltino-3388.vercel.app/`; it is proxy-blocked here. No new deployed preview URL or green build is claimed.
- Native 200%/400% browser zoom, Safari/Firefox, native saved-credential autofill and screen-reader announcements remain manual acceptance tasks. 720/360px checks are equivalent reflow from 1440px, not native zoom. Autofill was verified with Chromium's forced pseudo-state, without stored credentials. Existing account custom-overlay focus containment is not redesigned or certified by this visual pass.

Review order remains Phase 1 → readability → progress integrity → Learn task flow → this branch. The handoff lists PRs 22–25; GitHub API access is Forbidden, so their current state cannot be confirmed here. Recheck refs before each merge. No merge, production deployment or backend deployment is performed.
