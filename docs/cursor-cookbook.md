# Cursor Cookbook

Chloei Code follows patterns from the official [Cursor Cookbook](https://github.com/cursor/cookbook) (`cursor/cookbook`). Use it as the reference implementation when extending cloud-agent UX, SDK calls, or infrastructure.

## Which example maps here

| Cookbook path | Use when |
|---------------|----------|
| [`sdk/agent-kanban`](https://github.com/cursor/cookbook/tree/main/sdk/agent-kanban) | Cloud agent listing, kanban-style grouping, artifact previews, `Agent.create({ cloud })`, repository/model pickers |
| [`sdk/quickstart`](https://github.com/cursor/cookbook/tree/main/sdk/quickstart) | Minimal `Agent` + streaming smoke tests |
| [`sdk/app-builder`](https://github.com/cursor/cookbook/tree/main/sdk/app-builder) | Local agent sessions and iframe preview loops (not used in this control plane) |
| [`sdk/coding-agent-cli`](https://github.com/cursor/cookbook/tree/main/sdk/coding-agent-cli) | Terminal workflows |
| [`sdk/dag-task-runner`](https://github.com/cursor/cookbook/tree/main/sdk/dag-task-runner) | Fan-out DAG orchestration + Cursor skill |
| [`self-hosted-cloud-agent`](https://github.com/cursor/cookbook/tree/main/self-hosted-cloud-agent) | Running cloud agent workers on your own AWS (EC2, ECS, EKS) |

This app is closest to **agent-kanban**: a signed-in web UI over **cloud** agents with GitHub repos, status, PR links, and artifacts. Chloei Code adds Postgres persistence, Auth.js, GitHub OAuth repo/branch discovery, PR lifecycle/cleanup, and production cron/limits.

## SDK practices (from cookbook)

- Keep `CURSOR_API_KEY` **server-only** (never `NEXT_PUBLIC_*`).
- Create cloud runs with `Agent.create({ cloud: { repos, autoCreatePR } })` then `agent.send(prompt, { idempotencyKey })`.
- Reconnect with `Agent.getRun(runId, { runtime: "cloud", agentId, apiKey })`.
- List models via `Cursor.models.list()` and connected repos via `Cursor.repositories.list()` (cache briefly; see `src/lib/cursor/repositories.ts`).
- Stream with `run.stream()`, finalize with `run.wait()`, cancel with `run.cancel()` when supported.
- Artifacts: `agent.listArtifacts()` / `downloadArtifact()`; serve bytes through authenticated app routes (see cookbook `artifacts/media`).

Official SDK docs: [Cursor SDK TypeScript](https://cursor.com/docs/api/sdk/typescript).

## Local cookbook checkout

To browse or diff against upstream examples:

```bash
git clone --depth 1 https://github.com/cursor/cookbook.git /tmp/cursor-cookbook
```

Compare `sdk/agent-kanban/src/lib/agents/server.ts` with `src/lib/cursor/agent-service.ts` when SDK shapes change.

## API key

Create a key in the [Cursor integrations dashboard](https://cursor.com/dashboard/integrations) and set `CURSOR_API_KEY` in `.env` (this app uses one server key, not per-user keys like the kanban demo).
