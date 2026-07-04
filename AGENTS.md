<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Single Next.js 16 (App Router) app — a Brave-API-backed search engine. npm is the package manager; there is no database, Docker, or other backing service. Standard commands live in `package.json` (`dev`, `build`, `start`, `lint`); type-check with `npx tsc --noEmit`. There is no test framework/`test` script — validate via the browser or the curl commands in `README.md` ("Verifying the proxy from the terminal").

Non-obvious caveats:
- The app requires a `.env.local`. With no Brave API key it still runs fully offline when `BRAVE_MOCK=1`, which serves canned fixtures from `src/lib/fixtures/` and makes zero external calls — use this for dev/testing. Set `BRAVE_MOCK=0` and add `BRAVE_API_KEY` (see `.env.example`) only for live search. `.env.local` is gitignored, so recreate it per environment.
- The Brave key is read only in `src/lib/brave.ts` (imports `server-only`); importing it from client code fails the build.
- Cache/throttle/suggest-disabled state lives on `globalThis`, so it survives hot reloads; a full dev-server restart clears it.
- Dev server runs at http://localhost:3000.
