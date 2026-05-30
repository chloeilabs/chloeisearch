<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Services

| Service | Purpose | Start |
|---------|---------|--------|
| PostgreSQL 16 | Prisma datastore | `sudo docker compose up -d` (host port **55432**) |
| Next.js dev server | App + API | `pnpm dev` → http://localhost:3000 |

CI runs lint/typecheck/test/build **without** Postgres; local E2E needs the database.

### First-time setup (after `pnpm install`)

One-shot bootstrap: `pnpm setup:dev` (Postgres, deps, migrations, `.env` secrets merge).


1. `cp .env.example .env` and set at least `AUTH_SECRET` (e.g. `openssl rand -base64 32`).
2. For local UI without GitHub OAuth: `ALLOW_DEV_AUTH_BYPASS="true"` (non-production only).
3. `CRON_SECRET` must be **omitted or non-empty** — `CRON_SECRET=""` fails Zod validation and breaks `/api/health`.
4. `pnpm exec prisma migrate deploy` (non-interactive) or `pnpm db:migrate` (interactive).
5. Start Postgres before migrations.

### Commands (from `package.json`)

- Lint: `pnpm lint`
- Types: `pnpm typecheck`
- Tests: `pnpm test` (mocked DB/SDK; no Docker required)
- Build: `pnpm build`
- Dev: `pnpm dev`

### Gotchas

- **Docker**: In this VM, `docker` often requires `sudo` (socket permissions). Use `docker compose up -d` (user in `docker` group) or `sudo` if needed.
- **Node**: CI uses Node 24; Node 22+ works for local dev.
- **Cursor / GitHub APIs**: Placeholder `CURSOR_API_KEY` and no GitHub OAuth token are fine for UI and DB flows; `/api/health/deep` will report `cursor_api` / `github_api` errors until real credentials are configured.
- **Next.js docs**: See `node_modules/next/dist/docs/` for this repo’s Next.js 16 APIs (differs from older training data).
