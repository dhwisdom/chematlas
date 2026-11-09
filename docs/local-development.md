# ChemWaypoint development at $0 additional subscription cost

This branch is for local development and mock frontend review. It creates no hosted Supabase project, paid branch, Vercel project, subscription, or external mail workflow. Production remains on `main` until a separately approved release. Do not merge this branch as a production release: explicit production configuration and migration-history reconciliation require a separate review.

## Prerequisites

- Git and Node.js **24** (use the same major version on all computers; `.nvmrc` records it).
- Windows: Docker Desktop using Linux containers and WSL2, with the engine running. Docker Desktop is free for eligible personal use.
- macOS (Apple silicon or Intel): a free local Docker-compatible runtime, such as Docker Desktop for eligible personal use or Rancher Desktop with the dockerd/Moby engine. Do not purchase a runtime subscription. A working local Docker context is required; remote TCP Docker contexts are rejected.
- Space and memory for the local stack. The first start downloads images and can take several minutes. Subsequent starts reuse the image cache.

The Node commands below are identical in Windows PowerShell and macOS Terminal. No Bash activation, global Supabase installation, Supabase login, hosted project linking, production key, or OpenAI key is needed.

## Install and run

```text
git clone https://github.com/dhwisdom/chematlas.git
cd chematlas
git switch chore/local-dev-safety
npm ci
npm test
npm run dev:mock
```

Open **http://127.0.0.1:3000**. Ctrl+C stops the frontend. This mode requires no container runtime. Use `learner-a@example.invalid`, `learner-b@example.invalid`, or `editor@example.invalid` to sign into the mock adapter; typed passwords are ignored only in mock mode. The banner identifies synthetic frontend demonstrations. Admin writes not implemented by the adapter report that local integration mode is required. The mock adapter does not establish database RLS correctness.

Both frontend commands print a three-step startup bar followed by **READY** and the browser URL. Once ready, the terminal stays running; silence while idle is normal. A `[browser] Page sent (HTTP 200).` message confirms a page request was served, not that browser JavaScript or backend requests have finished. Check the browser for those results. HTTP errors are logged by status only; URLs, query strings, passwords, and request bodies are not logged. These commands rebuild files when started; after editing source, stop and restart the frontend, then refresh the browser. In PowerShell, use `npm.cmd` instead of `npm` if script execution is blocked.

For real local Auth/database/Companion testing, open Docker Desktop (or your compatible local engine), stop the mock server, and run one command:

```text
npm run dev:local
```

Open the same address. In a second terminal:

```text
npm run test:integration
```

`dev:local` automatically runs the guarded `backend:start` command before building or serving the frontend. It resumes an already running backend, retains your local data and fixture passwords, and prints a waiting message every five seconds while the backend starts. If Docker or the backend fails, it stops with an error instead of opening a frontend that cannot sign in. You do not need a separate backend terminal. Docker itself must already be running.

Ctrl+C stops the frontend; the backend containers stay running so data and sessions remain available between frontend restarts. When finished, use `npm run backend:stop` to stop those services while retaining data. In Windows PowerShell, the equivalent commands are `npm.cmd run dev:local` and `npm.cmd run backend:stop`.

`backend:start` creates/validates a loopback-bound local Docker network, starts Supabase, applies the local migration chain and seed, then creates synthetic Auth users through the local Auth admin API. First startup fails if a migration fails; it never substitutes mocked tests for real integration tests.

Generated URLs, API keys, and connection strings are kept in ignored `.local/runtime.json`. Passwords are generated randomly and stored in ignored `.local/accounts.json`. Test connector signing keys are in ignored `.local/connector-keys.json`. These are disposable local credentials; never reuse them in production. Do not paste them into issues or commit them.

Local test accounts:

| Email | Use |
| --- | --- |
| `learner-a@example.invalid` | Confirmed learner with synthetic legacy lesson completion |
| `learner-b@example.invalid` | Independent confirmed learner for ownership/RLS tests |
| `editor@example.invalid` | Confirmed synthetic owner for local Admin tests |
| `unconfirmed@example.invalid` | Email-confirmation rejection tests |

Use the generated password from `.local/accounts.json` for actual local sign-in. The seed is idempotent. The test accounts are created locally with controlled confirmation states; they are not exported production Auth users. Additional signup confirmation emails are captured locally at **http://127.0.0.1:54324**. No external SMTP, Gmail, n8n send action, or SMS provider is configured.

Studio, Storage, Realtime, and analytics are disabled to keep the test stack small; the application does not require them for these tests. Database REST/Auth and Edge Functions use **http://127.0.0.1:54321**. Use `127.0.0.1:3000` consistently for app tests. Other localhost apps can use different origins, but authentication callbacks and function origins intentionally allow only the documented app destinations.

## Stop, restart, reset, and test

| Command | Effect |
| --- | --- |
| `npm run backend:status` | Checks local services and privately refreshes connection information |
| `npm run dev:local` | Starts/resumes the guarded local backend, then serves the frontend in one terminal |
| `npm run backend:stop` | Stops this project's services; retains local development data |
| `npm run backend:start` | Starts/resumes local services and idempotently ensures synthetic accounts |
| `npm run backend:seed` | Ensures synthetic accounts without resetting the database |
| `npm run backend:reset` | **Deletes this local project's data**, reapplies migrations and seeds, and recreates fixture accounts |
| `npm test` | Chemistry, UI, environment safety, mock-service, and local HTTP tests; external requests blocked |
| `npm run test:integration` | Real local Auth, REST/RLS, concurrent state merge, Companion, signatures/replay, and SQL permission tests |
| `npm run build` | Creates a mock frontend artifact in ignored `dist/` by default |
| `npm run build:companion` | Rebuilds function bundles from canonical course/check data and handler source |

The integration suite requires a running backend. It fails visibly if the backend is absent; `npm test` is the Cloud fallback. Run the integration suite only against disposable local data. The integration suite creates uniquely named synthetic Auth accounts for each run and deletes those accounts and their dependent practice/progress rows afterward. SQL suites roll back their fixtures. A reset provides an additional clean rebuild check; it is an explicit destructive command, not part of the normal test command.

One standard local backend uses fixed ports and the project ID `chemwaypoint-local`. Do not run two copies simultaneously. Stop the first before starting another worktree. Windows and Mac have independent local data; migrations and fixtures travel through Git, not database synchronization. Two browser profiles against one instance exercise concurrent-device behavior. Use separate profiles for different synthetic accounts when testing the current main baseline: the account-cache isolation improvements in stacked PR #24 are intentionally not merged here. Test that PR separately on this safety foundation.

## Production safety

- Source checkouts default to `mock`; missing local settings are an error in local mode.
- Vercel Preview builds accept **mock mode only**. Supplying hosted Supabase URLs causes a build failure.
- The browser refuses production configuration on preview/localhost hosts. Development fetch guards and build CSP restrict backend connections.
- Public build output excludes `.local`, dotenv files, SQL, backend source, tools, and tests. Only an explicit public configuration allowlist is serialized.
- Local wrappers accept only start/stop/status/reset/seed. They reject extra CLI arguments, remote URLs, and a linked project's `supabase/.temp/project-ref`.
- A private `dev_guard.identity` marker is checked before reset/seed/SQL tests. This complements loopback-only URLs; it is not a credential.
- No local command calls `db push`, `migration repair`, `link`, `deploy`, or production management APIs.
- Tutor requests are deterministic simulations outside explicit production mode. Studio has no OpenAI key. Automated test processes delete inherited cloud credentials and reject external network destinations.
- Production service roles, account records, sessions, SMTP settings, connector identity, and live n8n workflows are never copied.

Raw Supabase commands can bypass repository wrappers. Do not link this checkout or use `--remote`, `db push`, or deployment commands. Keep production access out of your development process.

## Migrations and recovered definitions

Read-only inspection recovered the original initial schema, public curriculum RLS migration, and Companion storage/grading migration. Existing migration filenames were preserved to avoid rewriting the open development branches. The applied production timestamps differ from four repository timestamps; the mapping is recorded in `docs/migration-recovery.md`.

This directory is a **fresh local rebuild sequence**, not authorization to replay it against production. The old production HTTP smoke-test extension migration is intentionally omitted: no current application feature depends on it, and automated tests must not use it to make paid/external calls.

The new local safety migration explicitly grants learner access behind RLS, combines Tutor-message account/thread ownership into one policy, and makes grading result links environment-aware. These local hardening changes have not been applied to production.

The website Companion verifies local learner JWTs and keeps practice grading server-side. The recovered connector function uses newly generated local signing keys and audience `chemwaypoint-local-only`. It is tested through signed HTTP requests; the existing ChatGPT production connector is not changed or connected to your localhost.

## Vercel Hobby previews

The repository build emits mock assets in `dist`. Existing Vercel Git integration may automatically build this branch/PR in both linked projects. Those builds must use mock mode and contain no production keys. No Vercel settings are changed by this branch, and a dashboard build-command override may need separate review if it bypasses `vercel.json`.

Previews demonstrate the frontend. They do not connect to your laptop, send mail, call OpenAI, or prove RLS. No permanent hosted staging database or `staging.chemwaypoint.com` backend is provided at this budget. Do not create public tunnels for the local stack.

## Codex Cloud and native runtime

The supported baseline is the same container workflow where a local daemon is available, with `npm test` as a mock fallback. The experimental native runtime is optional and must not change the main configuration or weaken safety checks. See `docs/validation-local-development.md` for the bounded experiment and observed results.

## Costs and limits

No new hosting/database subscriptions or API/email charges are required. Use existing Codex and Vercel Hobby allowances. Standard GitHub-hosted CI jobs on this public repository run tests without secrets or paid services; do not select paid/larger runners. CI and previews remain subject to provider limits. If a limit is reached, stop or run locally instead of upgrading or enabling paid usage.

## Exact Windows desktop setup

Install Git for Windows, **Node.js 24**, and a free-for-personal-use Docker Desktop installation with WSL2 and Linux containers. Open Docker Desktop and wait for the engine to be ready. No Supabase account login or production credentials are needed. Confirm `node --version` starts with `v24` and `docker version` reports a server.

For your existing checkout, open PowerShell:

```powershell
Set-Location 'C:\Users\dalto\GitHub\chematlas'
git status --short
git fetch origin
git switch chore/local-dev-safety
git pull --ff-only
node --version
docker version
npm ci
npm test
npm run dev:local
```

If `git status --short` lists personal changes, save or commit them before switching branches; do not discard them. If the checkout does not exist yet, clone first:

```powershell
git clone https://github.com/dhwisdom/chematlas.git 'C:\Users\dalto\GitHub\chematlas'
```

Open **http://127.0.0.1:3000**. In a second PowerShell window:

```powershell
Set-Location 'C:\Users\dalto\GitHub\chematlas'
npm run test:integration
```

For frontend-only work, use `npm run dev:mock` instead of starting the database. Stop the frontend with Ctrl+C. Stop the database with `npm run backend:stop`. Rebuild disposable local data with `npm run backend:reset`.

## Exact macOS setup

Install Git, **Node.js 24**, and a free Docker-compatible runtime using the local dockerd/Moby engine. Docker Desktop for eligible personal use works on Intel and Apple silicon; Rancher Desktop is another free option. Start the engine. The experimental native Supabase runtime is not required.

For a new checkout in Terminal:

```sh
mkdir -p ~/GitHub
cd ~/GitHub
git clone https://github.com/dhwisdom/chematlas.git
cd chematlas
git switch chore/local-dev-safety
node --version
docker version
npm ci
npm test
npm run dev:local
```

For an existing checkout, use `cd ~/GitHub/chematlas`, check `git status --short`, save personal changes if needed, then `git fetch origin`, `git switch chore/local-dev-safety`, and `git pull --ff-only` before the Node commands. Substitute your existing checkout's path if different.

Open **http://127.0.0.1:3000**. In another Terminal window:

```sh
cd ~/GitHub/chematlas
npm run test:integration
```

Stop the frontend with Ctrl+C, stop services with `npm run backend:stop`, and reset only disposable local data with `npm run backend:reset`.

## Browser verification and durable evidence

Real Chromium verification is separate from jsdom and from real Supabase integration tests:

```text
npx --no-install playwright install chromium
npm run test:browser
```

On Linux, install the browser's system dependencies if needed using the documented Playwright installer (`npx --no-install playwright install --with-deps chromium`). This is a free local dependency install. CI does this on its standard Ubuntu runner. Browser downloads require access to the vendor download hosts; if a restricted Cloud environment blocks them, use the browser CI job or an already installed Chromium executable rather than bypassing network policy.

The browser suite uses only mock data and blocks outbound requests. It checks real app boot, the account form, guest evidence merging into the first synthetic account, mock Tutor chat, five-question Companion practice, and production-fetch rejection. It saves desktop/mobile screenshots and a JSON report to ignored `.local/browser-evidence/`. CI uploads only those synthetic screenshots/report, with three-day retention. A durable local result is committed under `docs/local-development-evidence/`; those files contain no real account, password, token, or learner data.

Codex Cloud with an existing Chromium installation can set `CHROMIUM_EXECUTABLE_PATH` for the browser command. In PowerShell use `$env:CHROMIUM_EXECUTABLE_PATH = 'path-to-chromium.exe'`; in macOS/Linux use `CHROMIUM_EXECUTABLE_PATH=/path/to/chromium npm run test:browser`. Leave it unset to use Playwright's installed browser.
