import 'server-only';

import { cacheGet, cacheSet } from './cache';
import { MAX_PAGE, TAB_TO_VERTICAL, VERTICAL_CONFIG } from './constants';
import {
  normalizeAnswer,
  normalizeImages,
  normalizeNews,
  normalizeSpellcheck,
  normalizeStock,
  normalizeSuggest,
  normalizeVideos,
  normalizeWeather,
  normalizeWeb,
} from './normalize';
import { throttled } from './throttle';
import type {
  AnswerData,
  BraveChatCompletionsResponse,
  BraveImagesResponse,
  BraveNewsResponse,
  BraveRichResponse,
  BraveSpellcheckResponse,
  BraveSuggestResponse,
  BraveVideosResponse,
  BraveWebResponse,
  SearchData,
  SearchQuery,
  StockData,
  SuggestData,
  WeatherData,
} from './types';
import fixtureWeb from './fixtures/web.json';
import fixtureImages from './fixtures/images.json';
import fixtureNews from './fixtures/news.json';
import fixtureVideos from './fixtures/videos.json';

const BRAVE_HOST = 'https://api.search.brave.com';
const SEARCH_TTL_MS = 5 * 60 * 1000;
const SUGGEST_TTL_MS = 24 * 60 * 60 * 1000;
const SPELLCHECK_TTL_MS = 24 * 60 * 60 * 1000;
// Answers are the most expensive call (a billed web search each) — cache long.
const ANSWER_TTL_MS = 60 * 60 * 1000;
const KEY_PLACEHOLDER = 'your-api-key-here';

export class BraveApiError extends Error {
  constructor(
    public status: number,
    public retryAfter?: number,
  ) {
    super(`Brave API responded with status ${status}`);
    this.name = 'BraveApiError';
  }
}

export class BraveConfigError extends Error {
  constructor() {
    super('BRAVE_API_KEY is not configured — paste your key into .env.local');
    this.name = 'BraveConfigError';
  }
}

// Sticky per-process, per-key flag: a key without a Suggest subscription gets
// 400/401/403 from the endpoint; after one failure we stop calling it. Keyed
// by the failing key so swapping in a working key resets it automatically.
declare global {
  var __braveSuggestDisabledForKey: string | undefined;
}

const isMockMode = () => process.env.BRAVE_MOCK === '1';

// Brave sells each endpoint as a separate subscription with its own key.
type KeyKind = 'search' | 'suggest' | 'spellcheck' | 'answers';

function rawKey(kind: KeyKind): string | undefined {
  const value = {
    search: process.env.BRAVE_API_KEY,
    suggest: process.env.BRAVE_SUGGEST_API_KEY || process.env.BRAVE_API_KEY,
    spellcheck: process.env.BRAVE_SPELLCHECK_API_KEY || process.env.BRAVE_API_KEY,
    answers: process.env.BRAVE_ANSWERS_API_KEY,
  }[kind];
  return value && value !== KEY_PLACEHOLDER ? value : undefined;
}

function apiKey(kind: KeyKind): string {
  const key = rawKey(kind);
  if (!key) throw new BraveConfigError();
  return key;
}

async function braveFetch(
  kind: KeyKind,
  path: string,
  params: URLSearchParams,
  opts?: { shedWhenBusy?: boolean; jsonBody?: unknown; timeoutMs?: number },
): Promise<unknown> {
  const key = apiKey(kind); // fail fast, before consuming a throttle slot
  const method = opts?.jsonBody === undefined ? 'GET' : 'POST';
  const qs = params.size > 0 ? `?${params}` : '';
  const url = `${BRAVE_HOST}${path}${qs}`;
  return throttled(
    key,
    async () => {
      console.log(`[brave] upstream(${kind}) ${method} ${path}${qs}`);
      const res = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': key,
          ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        },
        body: opts?.jsonBody === undefined ? undefined : JSON.stringify(opts.jsonBody),
        cache: 'no-store',
        signal: AbortSignal.timeout(opts?.timeoutMs ?? 20_000),
      });
      if (!res.ok) {
        const retryAfter = Number(res.headers.get('retry-after')) || undefined;
        throw new BraveApiError(res.status, retryAfter);
      }
      return res.json();
    },
    opts,
  );
}

export async function braveSearch(query: SearchQuery): Promise<SearchData> {
  const started = Date.now();
  const vertical = TAB_TO_VERTICAL[query.tab];
  const cfg = VERTICAL_CONFIG[vertical];
  const page = cfg.supportsOffset ? Math.min(query.page, MAX_PAGE) : 1;

  const cacheKey = [
    'search',
    isMockMode() ? 'mock' : 'live',
    vertical,
    query.q.toLowerCase(),
    page,
    query.freshness ?? '',
    query.safesearch,
    query.country ?? '',
    query.nospell ? 'nospell' : '',
  ].join(':');

  const cached = cacheGet<SearchData>(cacheKey);
  if (cached) {
    console.log(`[brave] cache HIT ${cacheKey}`);
    return { ...cached, tookMs: Date.now() - started };
  }

  let raw: unknown;
  if (isMockMode()) {
    raw = { web: fixtureWeb, images: fixtureImages, news: fixtureNews, videos: fixtureVideos }[vertical];
  } else {
    const usp = new URLSearchParams({
      q: query.q,
      count: String(cfg.count),
      safesearch: cfg.mapSafeSearch(query.safesearch),
    });
    if (cfg.supportsOffset && page > 1) usp.set('offset', String(page - 1));
    if (cfg.supportsFreshness && query.freshness) usp.set('freshness', query.freshness);
    if (query.country) usp.set('country', query.country);
    // Verbatim search ("Search instead for …"): stop Brave auto-correcting.
    if (query.nospell) usp.set('spellcheck', '0');
    // Weather/stocks/sports hints (fetched separately via braveWeather).
    if (vertical === 'web') usp.set('enable_rich_callback', '1');
    raw = await braveFetch('search', cfg.path, usp);
  }

  let data: SearchData;
  switch (vertical) {
    case 'web':
      data = normalizeWeb(raw as BraveWebResponse, page);
      break;
    case 'images':
      data = normalizeImages(raw as BraveImagesResponse, page);
      break;
    case 'news':
      data = normalizeNews(raw as BraveNewsResponse, page);
      break;
    case 'videos':
      data = normalizeVideos(raw as BraveVideosResponse, page);
      break;
  }

  cacheSet(cacheKey, data, SEARCH_TTL_MS);
  return { ...data, tookMs: Date.now() - started };
}

/** Mock suggestions derive from the typed query so the dropdown feels real. */
function mockSuggestions(q: string): string[] {
  const suffixes = ['', ' meaning', ' examples', ' near me', ' reviews', ' vs alternatives', ' 2026'];
  return suffixes.map((s) => `${q}${s}`.trim()).filter((s) => s.length > q.length || s === q).slice(0, 8);
}

export async function braveSuggest(q: string): Promise<SuggestData> {
  const query = q.trim();
  if (query.length < 2) return { suggestions: [] };

  const cacheKey = `suggest:${isMockMode() ? 'mock' : 'live'}:${query.toLowerCase()}`;

  // Mock mode never touches upstream, so the sticky disable flag (set by a
  // previous live failure) must not silence it.
  if (isMockMode()) {
    const cachedMock = cacheGet<SuggestData>(cacheKey);
    if (cachedMock) return cachedMock;
    const data = { suggestions: mockSuggestions(query) };
    cacheSet(cacheKey, data, SUGGEST_TTL_MS);
    return data;
  }

  const key = rawKey('suggest');
  if (!key) return { suggestions: [], disabled: true };
  if (globalThis.__braveSuggestDisabledForKey === key) {
    return { suggestions: [], disabled: true };
  }

  const cached = cacheGet<SuggestData>(cacheKey);
  if (cached) return cached;

  try {
    const raw = await braveFetch(
      'suggest',
      '/res/v1/suggest/search',
      new URLSearchParams({ q: query, count: '8' }),
      { shedWhenBusy: true },
    );
    const data: SuggestData = { suggestions: normalizeSuggest(raw as BraveSuggestResponse) };
    cacheSet(cacheKey, data, SUGGEST_TTL_MS);
    return data;
  } catch (e) {
    // 400 included: Brave reports a missing Suggest subscription as
    // 400 OPTION_NOT_IN_PLAN (observed live), not just 401/403.
    if (e instanceof BraveApiError && [400, 401, 403, 404, 422].includes(e.status)) {
      globalThis.__braveSuggestDisabledForKey = key;
      console.warn(
        `[brave] suggest endpoint unavailable (${e.status}) — disabled for this key; dropdown will use local history`,
      );
      return { suggestions: [], disabled: true };
    }
    // 429, timeout, or shed: silently empty — never an error while typing.
    return { suggestions: [] };
  }
}

/**
 * "Did you mean …" correction for the current query. Best-effort: any
 * failure (no key, no subscription, 429, timeout) yields null and the UI
 * simply omits the line.
 */
export async function braveSpellcheck(query: SearchQuery): Promise<string | null> {
  const q = query.q.trim();
  if (!q) return null;

  const cacheKey = `spellcheck:${isMockMode() ? 'mock' : 'live'}:${q.toLowerCase()}:${query.country ?? ''}`;
  const cached = cacheGet<{ corrected: string | null }>(cacheKey);
  if (cached) return cached.corrected;

  if (isMockMode()) return null;
  if (!rawKey('spellcheck')) return null;

  try {
    const usp = new URLSearchParams({ q });
    if (query.country) usp.set('country', query.country);
    const raw = await braveFetch('spellcheck', '/res/v1/spellcheck/search', usp);
    const corrected = normalizeSpellcheck(raw as BraveSpellcheckResponse, q);
    cacheSet(cacheKey, { corrected }, SPELLCHECK_TTL_MS);
    return corrected;
  } catch (e) {
    if (e instanceof BraveApiError) {
      console.warn(`[brave] spellcheck unavailable (${e.status})`);
    }
    cacheSet(cacheKey, { corrected: null }, SPELLCHECK_TTL_MS);
    return null;
  }
}

const MOCK_ANSWER: AnswerData = {
  text: [
    { text: 'This is a canned ', bold: false },
    { text: 'AI answer', bold: true },
    {
      text: ' served in mock mode (BRAVE_MOCK=1). Set BRAVE_MOCK=0 with a BRAVE_ANSWERS_API_KEY to get real grounded answers from the Brave AI Grounding API.',
      bold: false,
    },
  ],
  followups: [],
};

/**
 * Rich Callback fetch shared by the weather and stock cards. Callback keys
 * are short-lived and query-specific; failures just hide the card.
 */
async function braveRich(callbackKey: string): Promise<BraveRichResponse | null> {
  if (!/^[a-f0-9]{16,64}$/i.test(callbackKey)) return null;
  if (isMockMode()) return null;

  const cacheKey = `rich:${callbackKey}`;
  const cached = cacheGet<{ raw: BraveRichResponse | null }>(cacheKey);
  if (cached) return cached.raw;

  try {
    const raw = (await braveFetch(
      'search',
      '/res/v1/web/rich',
      new URLSearchParams({ callback_key: callbackKey }),
    )) as BraveRichResponse;
    cacheSet(cacheKey, { raw }, 10 * 60 * 1000);
    return raw;
  } catch (e) {
    if (e instanceof BraveApiError) {
      console.warn(`[brave] rich callback unavailable (${e.status})`);
    }
    return null;
  }
}

export async function braveWeather(callbackKey: string): Promise<WeatherData | null> {
  const raw = await braveRich(callbackKey);
  return raw ? normalizeWeather(raw) : null;
}

export async function braveStock(callbackKey: string): Promise<StockData | null> {
  const raw = await braveRich(callbackKey);
  return raw ? normalizeStock(raw) : null;
}

/**
 * AI answer via Brave's OpenAI-compatible AI Grounding endpoint
 * (POST /res/v1/chat/completions). One billed call per uncached query.
 * Best-effort: null hides the answer box.
 */
export async function braveAnswer(query: SearchQuery): Promise<AnswerData | null> {
  const q = query.q.trim();
  if (!q) return null;

  const cacheKey = `answer:${isMockMode() ? 'mock' : 'live'}:${q.toLowerCase()}`;
  const cached = cacheGet<{ answer: AnswerData | null }>(cacheKey);
  if (cached) return cached.answer;

  if (isMockMode()) return MOCK_ANSWER;
  if (!rawKey('answers')) return null;

  try {
    const raw = (await braveFetch(
      'answers',
      '/res/v1/chat/completions',
      new URLSearchParams(),
      {
        jsonBody: {
          model: 'brave',
          messages: [{ role: 'user', content: q }],
          stream: false,
        },
        // Grounded generation is slow — give it more room than search calls.
        timeoutMs: 30_000,
      },
    )) as BraveChatCompletionsResponse;

    const answer = normalizeAnswer(raw);
    cacheSet(cacheKey, { answer }, ANSWER_TTL_MS);
    return answer;
  } catch (e) {
    if (e instanceof BraveApiError) {
      console.warn(`[brave] answers unavailable (${e.status})`);
      // Subscription-level failures are stable — cache the negative.
      if ([400, 401, 403, 404, 422].includes(e.status)) {
        cacheSet(cacheKey, { answer: null }, ANSWER_TTL_MS);
      }
    }
    return null;
  }
}
