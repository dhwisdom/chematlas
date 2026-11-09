# Isolated integration baseline

Reviewed 2026-11-09 on local branch `integration/review-baseline`. This branch is approved for publication to GitHub for isolated testing only; it is not merged to main or deployed. The existing Windows setup and its 12 successful integration checks remain accepted prior evidence; this report distinguishes fresh cloud-workspace results.

## Inputs and reconciliation

- Main: `8813205ee8d3b848e5ad30c7cc26733ac04fef93`.
- Local development PR #26: `234a359c31976e4d4ca6fac41bc923b055907bf6`.
- Local development/light surfaces PR #27: `b8098cd751843eb9dc05a39e0bd8c1cebd830cc0` (contains #26).
- Accessibility #22, readability #23, progress integrity #24, Learn #25, and account/resources/Companion/streak tip: `d56f90196519c1ac2c807de2114e4b29e9f34720` (contains all four).
- Setup correction committed first as `604f7f9`: published setup instructions now select `fix/practice-lab-contrast`, not the older `chore/local-dev-safety` branch.

Four files conflicted. In `chematlas-tutoring.css`, keep the accessible responsive layout and disclosure structure while retaining PR #27 light Labs/Tutor surfaces; discard obsolete fixed three-column Tutor overrides. In `tutor-enhancements.css`, retain the accessible layout and font scale plus PR #27 message-column placement and title wrapping. In `genchem-tools.css`, keep safe variable fallbacks, readable controls, and demo-banner clearance. In the Companion server test, retain preview-origin rejection and expired-session CORS coverage using local allowed origins.

The local-environment implementation of Companion already includes the account/resources branch's server CORS behavior. Rebuilding both generated functions produces no diff. Main's authentication and server storage contracts are not replaced. Progress owner checkpoints, delayed-response epoch guards, first-answer evidence, and truthful streaks are retained from #24 and the later fixes. Dark mode remains deferred.

## Test harness changes

- Provide the browser `matchMedia` API in the jsdom bootstrap fixture.
- Open Tutor disclosures before measuring expanded cards; check readable phone width and absence of overflow.
- Run the older accessibility suite through the guarded mock asset server rather than a repository-root file server.
- Route its synthetic Companion responses to the same origin, so tests exercise network failure/retry without being intercepted by the separate demo adapter.
- Supply `URL` and explicit local settings to its VM-backed CORS fixture.
- Pin `axe-core` and add `npm run test:accessibility` so the suite no longer depends on an undeclared external installation.

## Fresh validation

- Node 24.19.0; dependency installation succeeded using a writable temporary npm cache. The initial default-cache install failed because the home cache was not writable; no lockfile integrity checks were disabled.
- `npm test`: 107 passed, zero failed. Includes account checkpoints, assessment integrity, authorization, server Companion, mock services, and build/network safety.
- `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`: 27 passed, no uncaught browser errors, zero production backend requests. Covers synthetic sign-in/guest evidence, simulated Tutor/Companion, all seven Practice tools, seven molecule geometries, and light-surface contrast at desktop/mobile widths.
- Accessibility suite: 20 application checks passed in the full run; the remaining CORS fixture failed due to missing VM `URL`, was corrected, then passed its targeted rerun. Thus all 21 checks have passing results; not presented as one uninterrupted green run.
- Accessibility coverage includes keyboard focus, mobile drawer, first-answer preservation, all 19 Learn modules, account switches with delayed read/write/RPC/Tutor responses, account form states, lesson resources, and Companion network/auth/service/timeout/retry handling with retained locked answers. Axe audits cover the tested states, not every possible page state.
- Generated Companion bundles are reproducible; `git diff --check` passes.
- Synthetic screenshot/report evidence: [report](integration-evidence/report.json), [desktop Labs](integration-evidence/labs-1440.png), [mobile Labs](integration-evidence/labs-390.png), [desktop Tutor](integration-evidence/tutor-chat-1440.png), [mobile Tutor](integration-evidence/tutor-chat-390.png). Desktop Labs and mobile Tutor were visually inspected.

## Local backend blocker — isolated retry investigation

The guarded initial startup did not reach readiness while pulling `ghcr.io/supabase/postgres:17.11.0.011`; a concurrent test rerun hit `ENOSPC` creating `dist/`. After stopping startup, the final unit/UI rerun passed 107/107.

The authorized follow-up isolated the Postgres pull without changing application code or Docker settings:

- Docker 28.4.0 uses `vfs`, rooted at `/var/lib/docker` on the same 32 GiB filesystem as the workspace.
- Before retry: approximately 5 GiB used, 25 GiB free; inode usage 6%. Five other Supabase images were present (987.1 MB reported image size). No containers or volumes existed. The local Docker context and loopback network binding were verified.
- Registry access, manifests, checksums, and layer downloads succeeded. The amd64 manifest has 28 layers totaling approximately 318 MiB compressed. No network/authentication denial was observed.
- During extraction, filesystem use grew through 9, 14, 20, and 24 GiB to about 27 GiB. A monitor terminated only this exact image pull when free space fell below 3 GiB (3,087,613,952 bytes observed), before another full-disk error.
- Docker automatically released the incomplete extraction after cancellation: filesystem use returned to approximately 5 GiB, with 25 GiB free. The Postgres image remained unavailable; the original five images remained, with zero containers and zero volumes. No prune, volume deletion, unrelated-data removal, or daemon reconfiguration was performed.

This directly reproduces severe extraction-related storage pressure and strongly explains the earlier `ENOSPC`. Docker documents that [vfs deep-copies each parent layer](https://docs.docker.com/engine/storage/drivers/vfs-driver/), unlike copy-on-write drivers. The precise final space requirement was not measured because the pull was deliberately stopped with workspace headroom.

Real Auth/database/RLS/connector tests remain blocked before startup, not failed application assertions. Repeating the same pull on this environment is not useful. The smallest safe next step is to bring this integration commit to the already working Windows checkout without publishing it, then run `npm run dev:local` and `npm run test:integration`. Alternatively, the environment provider can supply a supported copy-on-write Docker storage driver and adequate workspace capacity; changing the managed daemon was not attempted. No additional subscription or paid resource was provisioned.

The code baseline remains commit `15d7217`; the storage-investigation follow-up changed only the report. A later publication-safety commit disables automatic Vercel deployment for this branch. The combined branch still needs real database integration verification, production migration-history reconciliation, and separately approved release configuration. Existing mock/browser passes do not establish production RLS correctness.

## Release limits

This is a review baseline, not approval for production. Production environment configuration, the documented migration-history reconciliation, and release ordering still require separate review. Mock and fixture-based browser results cannot prove real database RLS. No hosted project, production record, email delivery, paid API call, recurring task, or deployment was created. Automatic Vercel deployments are disabled specifically for `integration/review-baseline` in `vercel.json`; no other branch deployment setting is changed. The GitHub workflow has no push trigger.
