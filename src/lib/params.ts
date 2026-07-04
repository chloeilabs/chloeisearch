import {
  COUNTRIES,
  FRESHNESS_VALUES,
  MAX_PAGE,
  SAFESEARCH_VALUES,
  TABS,
} from './constants';
import type { Freshness, SafeSearch, SearchQuery, Tab } from './types';

const MAX_QUERY_LENGTH = 400; // Brave caps queries at 400 chars

const TAB_VALUES = TABS.map((t) => t.value);
const COUNTRY_VALUES = new Set(COUNTRIES.map((c) => c.value).filter(Boolean));

function isTab(v: string | undefined): v is Tab {
  return v !== undefined && (TAB_VALUES as string[]).includes(v);
}

function isFreshness(v: string | undefined): v is Freshness {
  return v !== undefined && (FRESHNESS_VALUES as string[]).includes(v);
}

function isSafeSearch(v: string | undefined): v is SafeSearch {
  return v !== undefined && (SAFESEARCH_VALUES as string[]).includes(v);
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Lenient parser for the /search page: junk values fall back to defaults,
 * page clamps into range. Returns null when there is no usable query
 * (caller redirects home).
 */
export function normalizeSearchParams(
  raw: Record<string, string | string[] | undefined>,
): SearchQuery | null {
  const q = (first(raw.q) ?? '').trim().slice(0, MAX_QUERY_LENGTH);
  if (!q) return null;

  const rawTab = first(raw.tab);
  const tab: Tab = isTab(rawTab) ? rawTab : 'all';

  let page = Math.floor(Number(first(raw.page)));
  if (!Number.isFinite(page)) page = 1;
  page = Math.min(Math.max(page, 1), MAX_PAGE);
  if (tab === 'images') page = 1; // images endpoint has no pagination

  const rawFreshness = first(raw.freshness);
  const rawSafeSearch = first(raw.safesearch);
  const rawCountry = first(raw.country)?.toUpperCase();

  return {
    q,
    tab,
    page,
    freshness: isFreshness(rawFreshness) ? rawFreshness : undefined,
    safesearch: isSafeSearch(rawSafeSearch) ? rawSafeSearch : 'moderate',
    country:
      rawCountry && COUNTRY_VALUES.has(rawCountry) ? rawCountry : undefined,
    nospell: first(raw.nospell) === '1' ? true : undefined,
  };
}

export type StrictParseResult =
  | { ok: true; params: SearchQuery }
  | { ok: false; error: string };

/** Strict parser for /api/search: any present-but-invalid value is a 400. */
export function parseSearchParamsStrict(
  sp: URLSearchParams,
): StrictParseResult {
  const q = (sp.get('q') ?? '').trim();
  if (!q) return { ok: false, error: 'Missing required parameter: q' };
  if (q.length > MAX_QUERY_LENGTH) {
    return { ok: false, error: `q exceeds ${MAX_QUERY_LENGTH} characters` };
  }

  const rawTab = sp.get('tab') ?? undefined;
  if (rawTab !== undefined && !isTab(rawTab)) {
    return { ok: false, error: `Invalid tab: must be one of ${TAB_VALUES.join(', ')}` };
  }
  const tab: Tab = isTab(rawTab) ? rawTab : 'all';

  const rawPage = sp.get('page') ?? undefined;
  let page = 1;
  if (rawPage !== undefined) {
    page = Number(rawPage);
    if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
      return { ok: false, error: `Invalid page: must be an integer 1-${MAX_PAGE}` };
    }
  }
  if (tab === 'images') page = 1;

  const rawFreshness = sp.get('freshness') ?? undefined;
  if (rawFreshness !== undefined && !isFreshness(rawFreshness)) {
    return { ok: false, error: `Invalid freshness: must be one of ${FRESHNESS_VALUES.join(', ')}` };
  }

  const rawSafeSearch = sp.get('safesearch') ?? undefined;
  if (rawSafeSearch !== undefined && !isSafeSearch(rawSafeSearch)) {
    return { ok: false, error: `Invalid safesearch: must be one of ${SAFESEARCH_VALUES.join(', ')}` };
  }

  const rawCountry = sp.get('country')?.toUpperCase() ?? undefined;
  if (rawCountry !== undefined && !COUNTRY_VALUES.has(rawCountry)) {
    return { ok: false, error: 'Invalid country: not in the supported list' };
  }

  const rawNospell = sp.get('nospell') ?? undefined;
  if (rawNospell !== undefined && rawNospell !== '1') {
    return { ok: false, error: 'Invalid nospell: must be 1 when present' };
  }

  return {
    ok: true,
    params: {
      q,
      tab,
      page,
      freshness: isFreshness(rawFreshness) ? rawFreshness : undefined,
      safesearch: isSafeSearch(rawSafeSearch) ? rawSafeSearch : 'moderate',
      country: rawCountry,
      nospell: rawNospell === '1' ? true : undefined,
    },
  };
}

/**
 * Single source of truth for /search URLs — used by the search box, tabs,
 * filters, and pagination so every navigation round-trips identically.
 * Defaults are omitted to keep URLs clean and cache keys canonical.
 */
export function buildSearchUrl(
  params: SearchQuery,
  overrides: Partial<SearchQuery> = {},
): string {
  const merged = { ...params, ...overrides };
  const usp = new URLSearchParams();
  usp.set('q', merged.q);
  if (merged.tab !== 'all') usp.set('tab', merged.tab);
  if (merged.page > 1 && merged.tab !== 'images') {
    usp.set('page', String(merged.page));
  }
  if (merged.freshness) usp.set('freshness', merged.freshness);
  if (merged.safesearch !== 'moderate') usp.set('safesearch', merged.safesearch);
  if (merged.country) usp.set('country', merged.country.toLowerCase());
  if (merged.nospell) usp.set('nospell', '1');
  return `/search?${usp.toString()}`;
}
