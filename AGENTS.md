<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Single Next.js 16 (App Router) app — a Brave-API-backed search engine. npm is the package manager; there is no database, Docker, or other backing service. Standard commands live in `package.json` (`dev`, `build`, `start`, `lint`); type-check with `npx tsc --noEmit`. There is no test framework/`test` script — validate via the browser or the curl commands in `README.md` ("Verifying the proxy from the terminal").

Non-obvious caveats:
- The app requires a `.env.local` (gitignored — recreate per environment). Two modes:
  - Offline/mock: `BRAVE_MOCK=1` serves canned fixtures from `src/lib/fixtures/` and makes zero external calls — no key needed. Good for UI work / demos.
  - Live: `BRAVE_MOCK=0` plus a real key. `BRAVE_API_KEY` is required; `BRAVE_SUGGEST_API_KEY`, `BRAVE_SPELLCHECK_API_KEY`, `BRAVE_ANSWERS_API_KEY` are optional and degrade gracefully.
- The Brave keys are provisioned as **Cursor Cloud secrets**, so in a fresh VM they arrive as environment variables. Build a live `.env.local` from them without printing values, e.g.:
  `{ echo BRAVE_MOCK=0; for k in BRAVE_API_KEY BRAVE_SUGGEST_API_KEY BRAVE_SPELLCHECK_API_KEY BRAVE_ANSWERS_API_KEY; do printf '%s=%s\n' "$k" "${!k}"; done; } > .env.local`
- Env changes are only picked up on dev-server (re)start; the server does not hot-reload `.env.local`, and a server started before secrets were injected won't see them. `mock ↔ live` requires a restart.
- The Brave key is read only in `src/lib/brave.ts` (imports `server-only`); importing it from client code fails the build.
- Cache/throttle/suggest-disabled state lives on `globalThis`, so it survives hot reloads; a full dev-server restart clears it.
- Dev server runs at http://localhost:3000.
