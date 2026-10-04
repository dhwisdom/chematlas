# Review-due reminders

Users enable **Remind me when reviews are due** in **My Progress → Account & sync** (or their account badge). Reminders are off unless they explicitly turn them on. Delivery uses the verified email in Supabase Auth and the same cloud progress/review calculation as My Progress.

## Import the workflow

Import `docs/n8n-review-reminders.json` into a **new** n8n workflow. Keep the existing personal learning-summary workflow separate.

1. Select your existing **Header Auth** credential on **Preview reminders**, **Prepare reminders**, and **Record delivery**. It uses `Authorization: Bearer <CHEMWAYPOINT_AUTOMATION_TOKEN>`.
2. Select your existing Gmail credential on **Send reminder**. Recipient, subject, and HTML are already expressions. Keep **Retry On Fail** off on Gmail.
3. Turn reminders on for your own ChemWaypoint account. Sign in, sync progress, and enable the checkbox in Account & sync.
4. Execute only **Preview reminders** first. It calls `GET /api/review-reminders`, does not reserve deliveries, and is not connected to Gmail. Inspect `reminders`: an empty array is expected if nobody opted in, no reviews are due, or the seven-day cooldown applies.
5. Run from **Manual test** to prepare and send real reminders to eligible opted-in accounts. The preparation request reserves each returned delivery for seven days. **Record delivery** then records successful Gmail sends.
6. Save and publish when ready. The imported schedule checks daily at **9:00 AM America/Chicago**. The workflow imports inactive and contains no credentials or pinned execution data.

## Node mapping

`Daily check / Manual test → Prepare reminders → Split reminders → Send reminder → Record delivery`

| Node | Setting | Value |
|---|---|---|
| Prepare reminders | Method / URL | POST `https://www.chemwaypoint.com/api/review-reminders` |
| Prepare reminders | JSON body | `{}` |
| Split reminders | Field to split / Include | `reminders` / No Other Fields |
| Send reminder | To | `{{ $json.to }}` |
| Send reminder | Subject | `{{ $json.email.subject }}` |
| Send reminder | Email type / Message | HTML / `{{ $json.email.html }}` |
| Record delivery | Method / URL | POST `https://www.chemwaypoint.com/api/review-reminders` |
| Record delivery | JSON body expression | `{{ { action: 'acknowledge', deliveryId: $('Split reminders').item.json.deliveryId, status: 'sent' } }}` |

## Delivery behavior

- Each preparation checks up to 25 eligible preferences, oldest checked first. Account checks use five concurrent workers and stop starting new work before the function deadline. Checked accounts rotate to the back so users without due reviews do not block others. `batchFull` signals that the batch limit was reached; for a larger audience, increase scheduled check frequency. Daily checks are intended for the initial small group, not a guarantee that more than 25 users will all be checked the same day.
- Only verified, non-anonymous, non-banned accounts with synced progress and due reviews receive a prepared email. Account IDs and destination emails are not accepted in request input. The server automation token authorizes this multi-account endpoint; keep it private in the n8n credential.
- The claim function locks the user's preference, rechecks opt-in and cooldown, and records a `claimed` delivery atomically. Concurrent preparation calls cannot claim two reminders within seven days. Opting out and back in does not reset that cooldown.
- The ledger stores only account ID, delivery ID, timestamps, and status. It stores no message body or email address. It is unavailable to browser clients.
- This is **at-most-once preparation**, not exactly-once Gmail delivery. A crash after claiming but before sending may skip that week's email. A failed or uncertain send stays reserved; there is no automatic resend. Gmail success records `sent`, which confirms provider acceptance, not inbox arrival.
- If Gmail fails, do not blindly retry that Gmail node or replay a saved execution: its existing email input can send a duplicate. Inspect Gmail Sent and the n8n execution first. Rerunning preparation will skip already claimed accounts. If sending stopped midway, remaining claims are also held for seven days. For a larger audience, replace Gmail with a provider and queue designed for controlled retries.
- Acknowledgements can safely be retried. The first terminal status wins (`sent` or `failed`); it never resets the cooldown. Manually record a known failed send with `{ "action": "acknowledge", "deliveryId": "...", "status": "failed" }`.
- Opt-out links open a confirmation page. Only its button POST changes the preference, so GET link scanners cannot unsubscribe users. Re-enabling reminders rotates the token, invalidating older opt-out links. Emails already prepared may still be sent if a user opts out between preparation and Gmail sending.

## Configuration and validation

Uses the existing production `CHEMWAYPOINT_AUTOMATION_TOKEN` and `SUPABASE_SECRET_KEY`; no new key is needed. `CHEMWAYPOINT_AUTOMATION_USER_ID` continues to scope the original personal summary endpoint and is not used by reminder batches.

Database changes: `supabase/migrations/20261004230049_review_reminders.sql`. RLS and column grants permit users to read and change only their own reminder boolean, not unsubscribe tokens or delivery/cooldown fields. No existing account is opted in by the migration.

Run:

```sh
node --test tests/review-reminders.test.cjs tests/reminder-settings.test.cjs tests/learning-summary.test.cjs tests/summary-email.test.cjs
```

The settings test requires `jsdom` (also used by existing UI checks). Execute `tests/reminder-permissions.sql` against Supabase to check ownership, restricted grants, opt-out, duplicate claims, cooldown, unsubscribe-token rotation, and immutable final delivery status. The transaction rolls back all test accounts and deliveries.
