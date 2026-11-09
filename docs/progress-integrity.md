# Progress integrity follow-up

Base: `fix/visual-readability` (`f207df0`). Review branch: `fix/progress-integrity`. No merge, deployment, schema/API change or historical-data cleanup is included.

## Reproduced defect

At the baseline, a fresh guest navigated through modules and semesters, then opened Progress. This created a history entry labelled “General Chemistry lesson completed” with value `[]`, despite **zero assessment events**. The header also showed a hardcoded **1 day streak**. The browser regression failed before implementation and passes afterward.

## Defined behavior

- A qualifying day requires a **fully answered, finished assessment run**, using its actual finish timestamp. Incorrect answers do not prevent first-pass completion; the assessment contract is unchanged.
- First lesson completion, eligible spaced review, and repeated assessment practice have different activity labels. Repeated runs do not become additional first completions. Reading, navigation, partial sets, storage changes, sign-in and refresh are not completions.
- A streak counts consecutive dates in the browser's current IANA timezone, ending today or yesterday. A gap resets the current streak to zero. Multiple runs on one date count once. Calendar dates, not 24-hour durations, handle midnight and daylight-saving transitions. Changing timezone recalculates the local-date presentation of the same immutable timestamps.
- Scientific Practice/VSEPR/Organic results use explicit submission events and distinct practice labels. They do not qualify an assessment streak or imply spaced mastery.
- Stable run-derived activity IDs prevent replay duplicates. Projection rejects missing answers, premature/empty finishes, cross-module answers and future evidence. It never writes assessment events.
- Existing history remains stored unchanged by assessment viewing/completion. Earlier labels appear as **unverified earlier activity**, with the original label retained in the Progress explanation; they are not used for streaks. No inferred completion dates or deletion of suspected historical mistakes.

## Browser/account boundary

Existing server keys, immutable event IDs and merge RPC payloads are unchanged. Two **browser-only** metadata keys checkpoint the existing active browser fields when switching between guest/A/B. Auth-provider storage is excluded. Account A's cache and Tutor history are not copied into B. Returning to A restores its interrupted assessment.

The first **explicit sign-in from guest mode** can carry guest work into the first account; its original guest checkpoint remains available. That checkpoint cannot then be automatically claimed by another account. Session restoration does not automatically upload browser data of unknown ownership: it is preserved in the guest checkpoint, while the account restores its own cache and cloud state. This deliberately favors retention/isolation over guessing the owner of legacy unsynced data. No server migration occurs; recovery/import of ambiguous legacy data should be an explicit separately reviewed action.

Checkpoint writes happen before replacement of active keys; failure to save that checkpoint leaves existing active work intact and prevents adoption/sync of the new account. A later restore-write failure attempts rollback, with the original strings also retained in the saved checkpoint for recovery. Existing unowned local data is not deleted. Account-epoch guards reject stale reads, writes/RPC follow-up actions and Tutor responses after an account switch. Requests already sent with the old user's authorization may finish for that old account; their responses cannot replace the new account's active state.

## Verification

- Six activity unit tests: incomplete/legacy/replayed evidence, first pass versus review/practice, invalid/future evidence, same-day deduplication, consecutive dates, local midnight and daylight-saving boundaries.
- Five checkpoint unit tests: A/B restore, explicit first guest claim, ambiguous legacy retention, interrupted-session restore, and failed checkpoint preservation.
- Eleven Chromium browser cases: all previous accessibility/chemistry/Tutor regressions plus fresh navigation, actual five-question completion and resume/reload, unchanged legacy history, same-day practice, A/B interrupted assessment ownership, delayed cloud read/upsert/RPC, late Tutor response isolation, and first guest claim.
- Existing Node and five jsdom UI suites remain required. Backend activity/maturity calculations are unchanged; first-answer locking, spaced eligibility/due dates and Companion tests remain intact.

Run in the prepared environment:

```bash
NODE_PATH=/workspace/chematlas-devtools/node_modules node tests/learning-activity.test.cjs
node tests/learner-state.test.cjs
NEXT_EVIDENCE=/tmp/progress-evidence \
NODE_PATH=/opt/codex/cua_node/lib/node_modules:/tmp/chematlas-audit/node_modules \
CHROMIUM_EXECUTABLE=/usr/bin/chromium node --test tests/browser-accessibility.cjs
```

## Review evidence and release limits

Before and after fresh-guest evidence is in `next-pass-evidence/`. Remote main was rechecked at `8813205`, with Phase 1 and readability still separate. Review order remains Phase 1 → readability → progress integrity → Learn/product polish. Recheck refs before merging; approval of one branch does not approve the rest.

GitHub API access and the supplied Vercel preview returned **Forbidden** in this environment. No green preview or production validation is claimed. Live student accounts, paid AI, email sending, native zoom and screen-reader announcements were not exercised. Use mocked/guest evidence and authorized preview validation before release.
