<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cookbook

Use the official [Cursor Cookbook](https://github.com/cursor/cookbook) as the reference for SDK and cloud-agent UX. See `docs/cursor-cookbook.md` for how each example maps to this repo.

Primary reference: **`sdk/agent-kanban`** (cloud agent board, artifacts, repositories). Compare `sdk/agent-kanban/src/lib/agents/server.ts` with `src/lib/cursor/agent-service.ts` when APIs change.

SDK docs: https://cursor.com/docs/api/sdk/typescript

## Cursor Cloud specific instructions

- **Stack:** `pnpm`, Postgres via `docker compose` (port **55432**), `pnpm setup:dev`, dev server `pnpm dev` → http://localhost:3000
- **UI:** Dark sidebar shell (`AppShell`), flat `DetailSection` panels, `cursor-panel` / `cursor-field` in `src/app/globals.css`
- **Verify:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`

## Open Agents UI

Shell and inbox patterns follow [vercel-labs/open-agents](https://github.com/vercel-labs/open-agents). See `docs/open-agents-ui.md` when changing layout.
