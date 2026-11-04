# Local migration recovery

Production was inspected using SELECT queries against migration records and a read-only Edge Function retrieval. No database row, migration record, Auth setting, or deployed function was changed. No learner data was selected.

Recovered DDL:

- `20260910211014_initial_chematlas_schema.sql`
- `20260910211042_secure_public_curriculum_tables.sql`
- `20261016164025_chemwaypoint_companion_bridge.sql`

The initial migration record escaped its quoted identifiers; those escape characters were normalized back into executable SQL. The schema, policy names, and definitions were retained. The Companion migration retains its original historical definition; the later local safety migration replaces only the grading result's origin expression, preserving the grading/event algorithm.

Existing repository migrations and production records:

| Name | Repository version | Applied production version |
| --- | --- | --- |
| tutor_message_context_metadata | 20260911 | 20260911142201 |
| admin_content_studio | 20261003164151 | 20261003165234 |
| webcenter_admin_workspace | 20261003180310 | 20261003180723 |
| assessment_event_merge | 20261003193135 | 20261003193245 |
| review_reminders | 20261004230049 | 20261004230049 |

Do not rename or repair production migration records from this branch. A future production release must independently reconcile this history before running any migration command. Local replay starts from an empty database and therefore does not need to impersonate applied production migration history.

The old `enable_http_for_tutor_smoke_test` production migration is not required locally. It was excluded rather than reproducing network-enabled smoke testing.

The deployed ChatGPT connector function was recovered as source. Its production verification key and application audience were removed and replaced with environment settings. Local-only guards reject hosted backend URLs. A generated private test key remains in `.local/connector-keys.json`, outside Git. Canonical course data is bundled by `scripts/build-companion-bridge.cjs`; no private learner data appears in either bundle.
