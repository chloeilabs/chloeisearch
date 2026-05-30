<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- **Stack:** `pnpm`, Postgres via `docker compose` (port **55432**), `pnpm setup:dev`, dev server `pnpm dev` → http://localhost:3000.
- **UI:** Dark-first shell with sidebar (`AppShell`), flat `DetailSection` panels on run detail, `cursor-panel` / `cursor-field` utilities in `src/app/globals.css`. Read `node_modules/next/dist/docs/` before changing Next.js APIs.
- **Verify:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
