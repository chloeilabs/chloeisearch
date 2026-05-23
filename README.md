# Cloud Coding Agents

A production-ready MVP control plane for Cursor cloud coding agent runs against GitHub repositories.

The app lets an authenticated user create, monitor, refresh, cancel, retry, and review Cursor cloud agent runs. It stores raw Cursor statuses/events defensively, keeps `CURSOR_API_KEY` server-side only, and supports optional Cursor pull request creation.

## Stack

- Next.js App Router, TypeScript, React 19
- Cursor TypeScript SDK: `@cursor/sdk`
- Postgres with Prisma
- Auth.js / NextAuth v5 beta with GitHub OAuth and Prisma adapter
- Tailwind CSS v4 and shadcn/ui
- Vitest for unit tests

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm dev
```

The Cursor SDK currently pulls in `sqlite3`; this repo allows that native build through `pnpm-workspace.yaml`.

Open `http://localhost:3000`.

## Environment Variables

Required:

- `DATABASE_URL`: Postgres connection string.
- `CURSOR_API_KEY`: Cursor Cloud Agents API key from Cursor Dashboard integrations.
- `AUTH_SECRET`: Auth.js secret.
- `AUTH_GITHUB_ID`: GitHub OAuth app client ID.
- `AUTH_GITHUB_SECRET`: GitHub OAuth app secret.

The GitHub OAuth provider requests `read:user`, `user:email`, `repo`, and
`read:org` so the app can list the signed-in user's own, collaborator, private,
and organization repositories without exposing the GitHub token to the browser.
Existing local sessions created before these scopes were added should sign out
and sign back in to grant the expanded repository discovery scope.

Optional:

- `ALLOW_DEV_AUTH_BYPASS=true`: local development only. Creates/uses a `dev-user` without OAuth.
- `DEFAULT_CURSOR_MODEL`: optional model ID. It is validated against `Cursor.models.list()` before run creation.
- `ALLOWED_GIT_HOSTS`: comma-separated allowed Git hosts. Defaults to `github.com`.
- `ALLOWED_GITHUB_ORGS`: comma-separated GitHub owners/orgs allowed for submitted repository URLs.
- `AGENT_RUN_RATE_LIMIT`: create/cancel/retry requests per user per minute. Defaults to `10`.

Never expose Cursor credentials through `NEXT_PUBLIC_*` variables.

## Cursor Integration

The server-side wrapper lives under `src/lib/cursor`.

- `Cursor.models.list()` populates the model selector.
- `Cursor.repositories.list()` provides connected repository suggestions.
- `Agent.create({ cloud })` creates repo-scoped cloud agents.
- `agent.send(prompt, { idempotencyKey })` starts a run.
- `Agent.getRun(runId, { runtime: "cloud", agentId })` reconnects.
- `run.stream()`, `run.wait()`, and `run.cancel()` power live updates and actions.

The installed SDK types are the implementation source of truth. Cursor cloud API shapes are beta, so raw statuses, events, and result payloads are stored as JSON alongside normalized app status.

## GitHub Repository Discovery

The new-run form loads repositories from:

```text
GET /api/github/repositories
```

When a repository is selected, the form also loads branches from:

```text
GET /api/github/branches?repoUrl=https://github.com/owner/repo
```

That route reads the signed-in user's GitHub OAuth token from the server-side
Auth.js `Account` record and calls GitHub's authenticated repository API. The
client receives only repository and branch metadata, never the OAuth token.
Cursor-connected repositories from `Cursor.repositories.list()` are merged into
the same selector and tagged when a GitHub repository is also connected in
Cursor.

## Pull Request Lifecycle

Completed runs with a Cursor-created PR show live GitHub metadata on the run
detail page. The server loads PR state, checks, commit statuses, reviews, inline
review comments, branch existence, and safe cleanup eligibility through:

```text
GET /api/agent-runs/:id/pull-request
POST /api/agent-runs/:id/pull-request/cleanup
```

Cleanup closes the linked PR and deletes only the matching stored head branch
when it is in the same repository, is not the base/default branch, and still
matches the branch returned by Cursor for that run. Cleanup writes an app event
to the run log.

## Database

The Prisma schema includes:

- Auth.js `User`, `Account`, `Session`, and `VerificationToken` models.
- `AgentRun` for Cursor IDs, repo/ref/model/prompt, normalized/raw statuses, PR metadata, result payloads, and retry linkage.
- `AgentRunEvent` for ordered raw Cursor/app events.
- `AgentRunArtifact` for optional SDK artifact metadata.

Run `pnpm db:migrate` after configuring a real `DATABASE_URL`.

## Streaming And Polling

Run detail pages load persisted events first, then attach to:

```text
GET /api/agent-runs/:id/stream
```

The SSE route persists Cursor stream events and finalizes with `run.wait()` when the stream closes. The UI also polls persisted events as a fallback. If your deployment cannot keep requests open reliably, add a worker/queue to perform refresh/finalization out of band.

## Security Notes

- All Cursor SDK calls happen in route handlers or server-only modules.
- Repository URLs are validated, normalized, and restricted by host/org env vars.
- Per-user ownership checks guard every run, event, action, and artifact endpoint.
- Create/cancel/retry routes use an in-memory per-process rate limiter for MVP. Use a shared limiter for multi-instance production.
- Raw event JSON is escaped by React and shown only in explicit debug disclosures.
- The app never accepts arbitrary shell commands as a separate input.

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Manual QA

1. Configure Cursor/GitHub integration and env vars.
2. Create a run against a small test repository.
3. Confirm it appears on the dashboard with normalized and raw status.
4. Confirm detail page events update through SSE or polling.
5. Cancel an active run and verify status/event persistence.
6. Retry a completed or failed run and verify the retry links to the original.
7. Confirm PR URL and branch metadata appear when Cursor returns them.
8. Confirm the PR panel shows GitHub checks/review comments and can clean up a disposable test PR.
9. Inspect browser HTML, network payloads, and bundles for absence of `CURSOR_API_KEY`.

## Troubleshooting

- No models: verify the API key belongs to a Cursor account/team with cloud agents enabled.
- Repo unavailable: confirm Cursor’s GitHub integration has access, or enter a valid allowed GitHub URL manually.
- GitHub repos missing: sign out and sign back in so GitHub grants the current
  repository discovery scopes. Also confirm organization SSO/access policies.
- No PR URL: PR creation depends on Cursor settings, repo permissions, and the `autoCreatePR` toggle.
- Stream disconnects: refresh the page; persisted events are the source of truth.
- Artifact list empty: artifact support depends on installed SDK/runtime behavior for the run.
