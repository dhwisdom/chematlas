# ChemWaypoint → n8n learning summary

The read-only `GET https://www.chemwaypoint.com/api/learning-summary` endpoint returns the last seven days of recorded lesson completions, current mastery, due reviews, the next step, direct lesson/review links, and a ready-to-use plain-text report. This is a rolling seven-day report, not a calendar-week report. No AI or email provider is required to generate it.

## 1. Configure the production server

In the Vercel project serving **www.chemwaypoint.com**, open **Settings → Environment Variables**. Add these for **Production** only:

| Name | Value |
| --- | --- |
| `CHEMWAYPOINT_AUTOMATION_TOKEN` | A new random token generated with `openssl rand -hex 32` on your own computer, or a password manager's random 64-character alphanumeric password. Save the same token in n8n. |
| `CHEMWAYPOINT_AUTOMATION_USER_ID` | Your verified ChemWaypoint user's UUID from Supabase → Authentication → Users. This fixes the endpoint to that one account. |
| `SUPABASE_SECRET_KEY` | A server secret beginning `sb_secret_` from the ChemWaypoint Supabase project → Settings → API Keys. Use an existing suitable secret or create a dedicated secret named for this integration. |

Do not paste the Supabase secret into n8n, browser code, GitHub, screenshots, or chat. n8n only needs the separate automation token. The Supabase secret is privileged; the API exposes only this summary and accepts no account selector or write operation.

Redeploy the latest production commit after saving the variables. Environment changes do not update an already-running deployment. Keep production secrets out of preview environments.

## 2. Update your existing HTTP Request node

Keep the Manual Trigger. Replace the earlier homepage connectivity test with:

| Setting | Value |
| --- | --- |
| Method | GET |
| URL | `https://www.chemwaypoint.com/api/learning-summary` |
| Authentication | Generic Credential Type |
| Generic Auth Type | Header Auth |
| Credential → Name | `Authorization` |
| Credential → Value | `Bearer YOUR_AUTOMATION_TOKEN` (one space after Bearer) |
| Options → Response → Response Format | JSON |

Save the credential under a recognizable name, such as **ChemWaypoint summary**. Do not add query parameters. Keep redirects off if your HTTP Request options expose that setting; use the exact `www` URL above.

Execute the workflow. Output should contain `counts`, `completedInPeriod`, `mastered`, `reviewsDue`, `nextStep`, `lastSyncedAt`, and `email`. Compare counts with your signed-in Progress page after letting cloud sync finish. `email.subject` and `email.text` are strings ready for an eventual email node; this endpoint sends nothing.

Old completion records have no trustworthy completion date. They count toward total completion but not “completed in the last 7 days.” Browser activity that has not synced cannot appear here. Missing or stale cloud progress produces an explicit warning. Mastery and due reviews use the same `assessment.summarize` function as the site, and published Admin lessons overlay bundled lessons using the same validation rules.

## Troubleshooting

| HTTP status | Meaning / action |
| --- | --- |
| 200 | JSON report returned. Inspect warnings and last sync time before interpreting it. |
| 401 | Automation token is missing or differs between n8n and Vercel. Check the Bearer prefix. |
| 400 | Remove query parameters; account scope comes from Vercel only. |
| 405 | Set the method to GET. |
| 503 | Server configuration is missing or invalid. Check all three production variables and redeploy. |
| 502 | Supabase could not be read. Check the secret belongs to the configured project, then retry. No partial report is returned. |

All responses disable caching. To revoke access, rotate or remove `CHEMWAYPOINT_AUTOMATION_TOKEN` in Vercel and redeploy, then update the n8n credential. No learner records, schema, permission policies, or Tutor conversations are changed by this integration.

## Next phase

After output matches Progress, add delivery only to the intended recipient, then a weekly Schedule Trigger with timezone **America/Chicago**. This implementation does not send mail or publish a scheduled n8n workflow. The proposed question-drafting queue is a separate feature.

## Validation

`node --test tests/learning-summary.test.cjs tests/assessment.test.cjs tests/content-store.test.cjs tests/startup.test.cjs tests/periodic-table.test.cjs`

With jsdom 26.1.0 available: `node tests/learn-assessment-ui.cjs`.

## References

- https://docs.n8n.io/integrations/builtin/credentials/httprequest/
- https://vercel.com/docs/environment-variables/managing-environment-variables
- https://supabase.com/docs/guides/api/api-keys
