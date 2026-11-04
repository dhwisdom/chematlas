# Validation of the local development foundation

## Completed in Codex Cloud

- Production recovery used read-only migration SELECTs and Edge Function retrieval. No learner rows were read and no production writes or service settings were changed.
- **89 offline checks passed**, including existing chemistry, assessment, content, reminder, and UI checks under the network-blocking test preload.
- New checks cover missing/invalid environment settings, production URLs, preview restrictions, privileged keys in public configuration, hosted project linkage, stripping inherited credentials, synthetic account isolation, private-file exclusion, and blocked paid-service requests.
- The built frontend was booted using jsdom with local resources only. Synthetic sign-in and Companion mounting passed. Canvas is stubbed for this bootstrap check; this is not a visual rendering/browser compatibility certification.
- The mock HTTP server serves friendly routes and rejects private files and live automation calls.

## Real backend validation

The PR's `Development safety` workflow runs offline tests/builds on standard Ubuntu, Windows, and macOS runners. Its Ubuntu job starts the local container stack, runs real Auth/RLS/Companion/SQL tests, resets it, reruns the integration tests, and stops it. No hosted backend credentials are supplied. The workflow is suitable for the existing public repository's standard free runners; do not move it to paid/larger runners.

**Passed:** all four jobs in [Development safety run 3](https://github.com/dhwisdom/chematlas/actions/runs/41770074619), testing application commit `423c9dd5dd34f3eab89ce908e5bc7854c751c4aa`:

- Windows, macOS, Ubuntu: install, 89 offline checks, and mock frontend build.
- Ubuntu real Supabase: fresh startup/migrations/seeding, **10 integration checks**, database reset/reseed, the same **10 checks again**, and shutdown.
- The real checks cover confirmed/unconfirmed Auth, refreshed sessions, cross-account RLS, admin self-promotion denial, concurrent immutable progress merge, Companion grading/idempotent retries/expiry/progress reconciliation, test connector signatures and replay denial, four SQL permission suites, and Tutor-thread ownership.
- The first run exposed a reset network-reconnection issue. The wrapper now preserves its verified loopback Docker network and waits for local Auth readiness. The full lifecycle passed after that fix.
- Integration accounts use unique per-run synthetic identities and are deleted afterward; persistent demo fixtures remain separate.

Physical Windows PC/MacBook container setup still needs verification on the user's machines; CI does not certify Docker Desktop/WSL2 configuration on a particular computer.

## Bounded native-runtime experiment

The pinned CLI 3.0.0 exposes the native runtime only when `[experimental] stack = true`. A separate ignored scratch configuration enabled it; the committed primary local configuration did not change. An explicit `--runtime native --eager` startup was bounded to 90 seconds.

Startup failed before service readiness: the stack owner attempted to create `/home/agent/.supabase` on a read-only filesystem, despite a writable `SUPABASE_HOME` under the workspace. No native Auth, RLS, or function success is claimed. No permission escalation, home-directory override, or unsupported runtime workaround was used. The native path is disabled; mocks remain the Cloud fallback.

The standard local container startup was also attempted in Cloud. The managed Docker daemon is reachable with command network permission, but large-image extraction exhausted the disposable workspace storage before readiness. That attempt was stopped and task-downloaded image caches were removed to recover space. No successful real-backend result is claimed for Cloud itself. The real container lifecycle was verified independently on Ubuntu CI. Cloud defaults to mocks.

## Scope limits

No OpenAI request, real email, SMS, n8n execution, paid provisioning, hosted migration, production Auth change, or function deployment is part of validation. Frontend PR previews use mocks. Local connector signature tests do not change the production ChatGPT connector or make localhost reachable from ChatGPT.

Account-cache improvements in existing stacked PR #24 remain separate. This branch retains baseline learner algorithms/contracts and uses separate browser profiles for multi-account testing. The local database includes stricter Tutor-message thread ownership; that hardening has not been applied to production.
