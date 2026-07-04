# Search

A Google-style search engine powered by the [Brave Search API](https://brave.com/search/api/), built with Next.js (App Router), TypeScript, and Tailwind CSS.

**Features**: Google-like homepage and results page · All / Images / Videos / News tabs · knowledge panel for entity queries (Brave infobox) · weather card with 7-day forecast and stock card with intraday chart (Brave Rich Callback API) · interactive instant tools with no API — scientific calculator (deg/rad, "calculator" or any expression), color picker, coin flip, dice roll, random number, countdown timer, stopwatch, tip calculator · unit-converter and time-in-city instant answers ("5 km in miles", "time in tokyo" — safe parser + Intl) · masonry image grid with click-to-preview · history "Delete" affordance in the suggest dropdown · keyboard-visible focus rings + header shadow on scroll · "People also ask" accordion (Brave faq block) · inline Videos row mixed into web results · "/" keyboard shortcut focuses the search box · Google Images-style click-to-preview panel · AI answer box (Brave AI Grounding) streamed in above web results · "Showing results for … / Search instead for …" when Brave auto-corrects (verbatim re-search via `nospell=1` → `spellcheck=0`) · "Did you mean …" corrections · autosuggest with keyboard navigation and local search history · voice search (Web Speech API) · "I'm Feeling Lucky" (redirects to the top result) · Related searches chips · classic Goooogle-style letter pagination · filters for time, SafeSearch, and region · light + dark mode (`prefers-color-scheme`) · every view is reconstructable from its URL (shareable links, working back/forward).

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Get API keys at <https://api-dashboard.search.brave.com/>. Brave sells each endpoint as a separate subscription, so there are up to four keys in `.env.local`:

   ```
   BRAVE_API_KEY=<web/images/news/videos search key>   # required
   BRAVE_SUGGEST_API_KEY=<autosuggest key>             # optional
   BRAVE_SPELLCHECK_API_KEY=<spellcheck key>           # optional
   BRAVE_ANSWERS_API_KEY=<AI grounding key>            # optional
   BRAVE_MOCK=0
   ```

   Missing optional keys degrade gracefully: suggest falls back to local search history, and the spellcheck line / AI answer box simply don't render. Each key gets its own 1-req/sec throttle queue, so the features run in parallel without tripping per-key rate limits.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

## Mock mode (protect your quota)

The Brave free tier allows ~1 request/second and ~2,000 requests/month. With `BRAVE_MOCK=1` in `.env.local` (the default as shipped), the app serves canned fixtures from `src/lib/fixtures/` and never calls Brave — useful for UI work and demos. Set `BRAVE_MOCK=0` (or remove it) to go live.

Even in live mode the app defends the quota:

- a **global throttle** spaces all upstream calls ≥1.1s apart (search + suggest share one queue)
- a **TTL LRU cache** (5 min for searches, 24 h for suggestions) serves repeats without spending quota
- autosuggest is debounced (300 ms), requires 2+ characters, and aborts stale requests
- 429s surface as a friendly countdown, never an automatic retry

## Endpoint subscription notes

- **Suggest**: if the key lacks the subscription, Brave responds 400 `OPTION_NOT_IN_PLAN` (observed live — not 401/403). The app detects this **once per key**, stops calling the endpoint, and the dropdown falls back to your recent local searches. No error is shown. Swapping in a working key resets the latch automatically.
- **Spellcheck** (`/res/v1/spellcheck/search`): called once per first-page web search (24 h cache); any failure just hides the "Did you mean" line.
- **AI answers**: uses Brave's OpenAI-compatible AI Grounding endpoint (`POST /res/v1/chat/completions`, model `brave`) — *not* the Summarizer flow. One billed call per uncached query (1 h cache), streamed into the page via Suspense so results never wait on it; failures hide the box.

## Architecture notes

- The API key is read only in [src/lib/brave.ts](src/lib/brave.ts), which imports `server-only` — importing it from client code fails the build. The browser only ever talks to same-origin routes (`/search`, `/api/search`, `/api/suggest`).
- The URL is the single source of truth: `/search?q=…&tab=…&page=…&freshness=…&safesearch=…&country=…`. Tabs, filters, and pagination are plain links built by `buildSearchUrl()` in [src/lib/params.ts](src/lib/params.ts).
- Brave responses are normalized in [src/lib/normalize.ts](src/lib/normalize.ts): descriptions arrive as HTML with `<strong>` highlights and are parsed into typed text segments — raw HTML never reaches the DOM.
- Brave's image endpoint supports no pagination and only `off|strict` SafeSearch; the per-vertical whitelist in [src/lib/constants.ts](src/lib/constants.ts) prevents invalid-parameter errors.
- The cache, throttle, and suggest-disabled flag live on `globalThis`, so they survive dev-mode hot reloads; a full restart clears them (fine locally).

## Verifying the proxy from the terminal

```bash
curl 'http://localhost:3000/api/search?q=hello'            # normalized results JSON
curl 'http://localhost:3000/api/search?q=hello&tab=news'   # vertical selection
curl 'http://localhost:3000/api/search?q='                 # 400
curl 'http://localhost:3000/api/suggest?q=wea'             # suggestions
```
