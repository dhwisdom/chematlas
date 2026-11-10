# Companion: View last result

This development change adds a read-only **View last result** control in Companion → Practice. After refresh, sign into the same account, open Practice, and select the control to reopen the most recently submitted Companion score and explanations, across all lessons. The lesson title is displayed. Current mastery is derived from current saved evidence; reopening never creates an attempt or changes completion.

The website handler authenticates the session and queries only that user's non-null submitted results, ordered by submission time and ID, limited to one. Caller-supplied account/session IDs cannot select another result. Only the saved result is selected, not an unfinished question bank. No schema or policy changes are required. The generated site function is rebuilt from its source; the ChatGPT connector is unchanged.

The control is disabled for guests and during unfinished practice or pending requests. Empty accounts get a clear no-results message. Network failures can be retried with the same control. Account changes clear the display, abort pending reads, and discard late responses. Unfinished-practice restoration is intentionally out of scope.

## Validation

- Node 24.19.0: 109 unit/UI tests passed, including authenticated, owner-bound, completed-only, read-only retrieval and empty results.
- Targeted Chromium tests passed for refresh/reopen, switching accounts, empty state, sign-out, and an old account's delayed response; existing failed-save/locked-answer retry also passed.
- Full Chromium accessibility suite: 23 tests passed in one run, including the new result test and the sidebar zoom regression.
- Mock Chromium suite: 27 checks passed.
- The real local integration suite now asserts empty results, retrieval of the saved score/details, cross-account denial even with spoofed arguments, and ignoring a newer unfinished set. These new assertions have not run in this cloud workspace due to its previously documented Docker storage blocker. Dalton's earlier 12-test pass predates this change.

## Windows verification after this commit is delivered

Use Node 24. Keep the existing checkout and ignored `.local` directory. Stop the frontend with Ctrl+C. Stop the local backend with `npm.cmd run backend:stop` to ensure its generated function is reloaded, then run:

```powershell
npm.cmd test
npm.cmd run dev:local
```

In another PowerShell window in the same repository:

```powershell
npm.cmd run backend:status
npm.cmd run test:integration
```

Expect the local backend URL `http://127.0.0.1:54321` and 12 passing integration tests with the expanded result assertions. No reset or database migration is needed.

At `http://127.0.0.1:3000`, confirm LOCAL TEST DATA. With synthetic learner A, complete a Companion set and wait for PRACTICE SAVED. Note its score and an explanation. Refresh, open Companion → Practice, and select View last result. Expect the same score/explanations and lesson title, without a new activity entry. Switch to learner B: A's result must disappear, and View last result must show B's own result or the empty message. Switch back to A and reopen. During a new unfinished set, the result control should be disabled so answers are not replaced.

The latest result can be from an earlier session and is not constrained by the lesson selector. The UI reads saved Companion sessions only, not Learn-only concept checks. Prior database cleanup may mean an older progress entry has no remaining Companion result. Production release still requires the previously documented configuration and migration-history review. Nothing in this change authorizes a push, merge, or deployment.
