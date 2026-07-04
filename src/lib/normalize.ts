import { PAGE_SIZE } from './constants';
import type {
  AnswerData,
  BraveChatCompletionsResponse,
  BraveImagesResponse,
  BraveMetaUrl,
  BraveNewsResponse,
  BraveRichResponse,
  BraveSpellcheckResponse,
  BraveSuggestResponse,
  BraveVideoItem,
  BraveVideosResponse,
  BraveWebResponse,
  FaqItem,
  KnowledgePanel,
  StockData,
  VideoResult,
  WeatherData,
  ImagesSearchData,
  NewsSearchData,
  VideosSearchData,
  WebSearchData,
  TextSegment,
} from './types';

// ---------------------------------------------------------------------------
// Text safety. Brave descriptions/titles arrive as HTML strings (with
// <strong> around query hits and entities like &amp;). Everything below
// guarantees that markup is reduced to plain-text segments — the UI renders
// them as React text nodes, never as HTML.
// ---------------------------------------------------------------------------

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&nbsp;': ' ',
};

function decodeEntities(s: string): string {
  return s.replace(/&(?:amp|lt|gt|quot|#39|#x27|nbsp);/g, (m) => ENTITIES[m] ?? m);
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

function cleanText(s: string): string {
  return decodeEntities(stripTags(s)).trim();
}

/** Like cleanText but preserves leading/trailing spaces between segments. */
function cleanSegment(s: string): string {
  return decodeEntities(stripTags(s));
}

/** Parse highlighted HTML into typed segments; all other markup is stripped. */
export function parseHighlights(html: string | undefined): TextSegment[] {
  if (!html || typeof html !== 'string') return [];
  const segments: TextSegment[] = [];
  const re = /<(strong|em|b)>([\s\S]*?)<\/\1>/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) {
      segments.push({ text: cleanSegment(html.slice(last, m.index)), bold: false });
    }
    segments.push({ text: cleanSegment(m[2]), bold: true });
    last = m.index + m[0].length;
  }
  if (last < html.length) {
    segments.push({ text: cleanSegment(html.slice(last)), bold: false });
  }
  return segments.filter((s) => s.text.length > 0);
}

/** Only real web destinations make it into hrefs (blocks javascript: etc.). */
function isHttpUrl(url: unknown): url is string {
  return (
    typeof url === 'string' &&
    (url.startsWith('https://') || url.startsWith('http://'))
  );
}

/** Images must be https or inline data URIs (fixtures use the latter). */
function safeImageSrc(src: unknown): string | undefined {
  if (typeof src !== 'string') return undefined;
  if (src.startsWith('https://') || src.startsWith('data:image/')) return src;
  return undefined;
}

/** "https://www.example.com/docs/api?x=1" → "example.com › docs › api" */
function toDisplayUrl(url: string, meta?: BraveMetaUrl): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const parts = u.pathname
      .split('/')
      .filter(Boolean)
      .slice(0, 3)
      .map((p) => {
        try {
          return decodeURIComponent(p);
        } catch {
          return p;
        }
      });
    return [host, ...parts].join(' › ');
  } catch {
    return meta?.netloc ?? meta?.hostname ?? '';
  }
}

function toSourceName(url: string | undefined, meta?: BraveMetaUrl): string | undefined {
  const host = meta?.hostname ?? meta?.netloc;
  if (host) return host.replace(/^www\./, '');
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Per-vertical normalizers: loose Brave JSON → strict internal types.
// Entries missing a usable title or URL are dropped; drift never crashes.
// ---------------------------------------------------------------------------

/** Brave's infobox → Google-style knowledge panel. Values arrive as HTML. */
function normalizeInfobox(raw: BraveWebResponse): KnowledgePanel | undefined {
  const first = Array.isArray(raw?.infobox?.results)
    ? raw.infobox.results[0]
    : undefined;
  if (!first || typeof first.title !== 'string' || !first.title.trim()) {
    return undefined;
  }

  const attributes = (Array.isArray(first.attributes) ? first.attributes : [])
    .filter((pair): pair is unknown[] => Array.isArray(pair) && pair.length >= 2)
    .map(([label, value]) => ({
      label: typeof label === 'string' ? cleanText(label) : '',
      value:
        typeof value === 'string'
          ? cleanText(
              value
                .replace(/<br\s*\/?>/gi, ' · ')
                // Wikipedia duplicates dates as "(1879-03-14)14 March 1879"
                .replace(/\(\d{4}-\d{2}-\d{2}\)/g, ''),
            )
          : '',
    }))
    .filter((a) => a.label && a.value)
    .slice(0, 8);

  const profiles = (Array.isArray(first.profiles) ? first.profiles : [])
    .filter((p) => typeof p?.name === 'string' && isHttpUrl(p?.url))
    .map((p) => ({ name: cleanText(p.name!), url: p.url! }))
    .slice(0, 4);

  return {
    title: cleanText(first.title),
    category:
      typeof first.category === 'string' ? cleanText(first.category) : undefined,
    description:
      typeof first.long_desc === 'string' ? cleanText(first.long_desc) : undefined,
    image: Array.isArray(first.images)
      ? safeImageSrc(first.images[0]?.src)
      : undefined,
    website: isHttpUrl(first.website_url) ? first.website_url : undefined,
    attributes,
    profiles,
  };
}

/** Shared by the videos vertical and the inline video block in web results. */
function mapVideoItems(items: BraveVideoItem[]): VideoResult[] {
  return items
    .filter((r) => typeof r?.title === 'string' && isHttpUrl(r?.url))
    .map((r) => ({
      title: cleanText(r.title!),
      url: r.url!,
      description:
        typeof r.description === 'string' ? cleanText(r.description) : undefined,
      thumbnail: safeImageSrc(r.thumbnail?.src),
      duration:
        typeof r.video?.duration === 'string' ? cleanText(r.video.duration) : undefined,
      age: typeof r.age === 'string' ? cleanText(r.age) : undefined,
      source:
        typeof r.video?.creator === 'string'
          ? cleanText(r.video.creator)
          : toSourceName(r.url, r.meta_url),
    }));
}

/** "People also ask" rows from the web response's faq block. */
function normalizeFaq(raw: BraveWebResponse): FaqItem[] {
  const items = Array.isArray(raw?.faq?.results) ? raw.faq.results : [];
  return items
    .filter(
      (f) => typeof f?.question === 'string' && typeof f?.answer === 'string',
    )
    .map((f) => ({
      question: cleanText(f.question!),
      answer: parseHighlights(f.answer),
      source: toSourceName(f.url, f.meta_url),
      url: isHttpUrl(f.url) ? f.url : undefined,
    }))
    .filter((f) => f.question && f.answer.length > 0)
    .slice(0, 4);
}

/** Brave often repeats the description verbatim as extra_snippets[0]. */
function isNearDuplicate(snippet: string, desc: string): boolean {
  const a = snippet.replace(/\s+/g, ' ').trim();
  const b = desc.replace(/\s+/g, ' ').trim();
  if (!a || !b) return false;
  return a.includes(b.slice(0, 100)) || b.includes(a.slice(0, 100));
}

export function normalizeWeb(raw: BraveWebResponse, page: number): WebSearchData {
  const items = Array.isArray(raw?.web?.results) ? raw.web.results : [];
  const results = items
    .filter((r) => typeof r?.title === 'string' && isHttpUrl(r?.url))
    .map((r) => {
      const description = parseHighlights(r.description);
      const descText = description.map((s) => s.text).join('');
      return {
        title: cleanText(r.title!),
        url: r.url!,
        siteName:
          typeof r.profile?.name === 'string' ? cleanText(r.profile.name) : undefined,
        displayUrl: toDisplayUrl(r.url!, r.meta_url),
        description,
        extraSnippets: Array.isArray(r.extra_snippets)
          ? r.extra_snippets
              .filter((s): s is string => typeof s === 'string')
              .map(cleanText)
              .filter((s) => !isNearDuplicate(s, descText))
          : undefined,
        favicon: safeImageSrc(r.meta_url?.favicon ?? r.profile?.img),
        age: typeof r.age === 'string' ? cleanText(r.age) : undefined,
      };
    });
  const altered =
    typeof raw?.query?.altered === 'string' ? cleanText(raw.query.altered) : '';
  const original =
    typeof raw?.query?.original === 'string' ? raw.query.original.trim() : '';

  return {
    vertical: 'web',
    page,
    hasMore: raw?.query?.more_results_available ?? results.length >= PAGE_SIZE,
    results,
    // Enrichments only decorate page 1 (matches Google; deeper pages skip them).
    infobox: page === 1 ? normalizeInfobox(raw) : undefined,
    alteredQuery:
      altered && altered.toLowerCase() !== original.toLowerCase()
        ? altered
        : undefined,
    faq: page === 1 ? normalizeFaq(raw) : [],
    inlineVideos:
      page === 1 && Array.isArray(raw?.videos?.results)
        ? mapVideoItems(raw.videos.results).slice(0, 6)
        : [],
    richHint:
      page === 1 &&
      typeof raw?.rich?.hint?.vertical === 'string' &&
      typeof raw?.rich?.hint?.callback_key === 'string'
        ? { vertical: raw.rich.hint.vertical, callbackKey: raw.rich.hint.callback_key }
        : undefined,
  };
}

/** OpenWeatherMap icon codes ("04n") → CDN URL; anything odd is dropped. */
function weatherIcon(code: unknown): string | undefined {
  return typeof code === 'string' && /^[0-9]{2}[dn]$/.test(code)
    ? `https://openweathermap.org/img/wn/${code}@2x.png`
    : undefined;
}

export function normalizeStock(raw: BraveRichResponse): StockData | null {
  const first = Array.isArray(raw?.results) ? raw.results[0] : undefined;
  const stock = first?.stock;
  const quote = stock?.quote;
  if (
    !quote ||
    typeof quote.latest_price !== 'number' ||
    typeof quote.change !== 'number' ||
    typeof quote.change_percent !== 'number'
  ) {
    return null;
  }

  const symbol = quote.symbol ?? stock.asset_info?.symbol;
  if (typeof symbol !== 'string' || !symbol) return null;

  const num = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isFinite(v) ? v : undefined;

  return {
    symbol: symbol.toUpperCase(),
    name:
      typeof quote.company_name === 'string'
        ? cleanText(quote.company_name)
        : symbol.toUpperCase(),
    exchange:
      typeof quote.primary_exchange === 'string' ? quote.primary_exchange : undefined,
    currency: typeof quote.currency === 'string' ? quote.currency : 'USD',
    price: quote.latest_price,
    change: quote.change,
    changePercent: quote.change_percent,
    open: num(quote.open),
    high: num(quote.high),
    low: num(quote.low),
    marketCap: num(quote.market_cap),
    peRatio: num(quote.pe_ratio),
    week52High: num(quote.week_52_high),
    week52Low: num(quote.week_52_low),
    prevClose: num(quote.close),
    points: (Array.isArray(stock.timeseries?.timeseries) ? stock.timeseries.timeseries : [])
      .map((p) => p?.close)
      .filter((c): c is number => typeof c === 'number' && Number.isFinite(c)),
    provider: typeof first?.provider?.name === 'string' ? first.provider.name : undefined,
  };
}

export function normalizeWeather(raw: BraveRichResponse): WeatherData | null {
  const weather = Array.isArray(raw?.results) ? raw.results[0]?.weather : undefined;
  const current = weather?.current_weather;
  if (!weather || typeof current?.temp !== 'number') return null;

  const loc = weather.location;
  const location = [loc?.name, loc?.state, loc?.country]
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
    .join(', ');

  const daily = (Array.isArray(weather.daily) ? weather.daily : [])
    .filter(
      (d) =>
        typeof d?.temperature?.min === 'number' &&
        typeof d?.temperature?.max === 'number' &&
        typeof d?.date_i18n === 'string',
    )
    .slice(0, 7)
    .map((d) => ({
      day: d.date_i18n!.split(',')[0].slice(0, 3),
      icon: weatherIcon(d.weather?.icon),
      minC: d.temperature!.min!,
      maxC: d.temperature!.max!,
    }));

  return {
    location: location || 'Current location',
    tempC: current.temp,
    feelsLikeC: typeof current.feels_like === 'number' ? current.feels_like : current.temp,
    description:
      typeof current.weather?.description === 'string'
        ? cleanText(current.weather.description)
        : '',
    icon: weatherIcon(current.weather?.icon),
    humidity: typeof current.humidity === 'number' ? current.humidity : undefined,
    windKmh:
      typeof current.wind?.speed === 'number'
        ? Math.round(current.wind.speed * 3.6)
        : undefined,
    daily,
  };
}

export function normalizeImages(raw: BraveImagesResponse, page: number): ImagesSearchData {
  const items = Array.isArray(raw?.results) ? raw.results : [];
  const seen = new Set<string>();
  const results = items
    .map((r) => ({
      title: typeof r?.title === 'string' ? cleanText(r.title) : '',
      url: isHttpUrl(r?.url) ? r.url! : '',
      thumbnail: safeImageSrc(r?.thumbnail?.src) ?? '',
      fullSrc: safeImageSrc(r?.properties?.url),
      source: typeof r?.source === 'string' ? cleanText(r.source) : undefined,
    }))
    .filter((r) => {
      if (!r.url || !r.thumbnail) return false;
      // Dedupe so `url|thumbnail` is a stable React key.
      const key = `${r.url}|${r.thumbnail}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return { vertical: 'images', page, hasMore: false, results };
}

export function normalizeNews(raw: BraveNewsResponse, page: number): NewsSearchData {
  const items = Array.isArray(raw?.results) ? raw.results : [];
  const results = items
    .filter((r) => typeof r?.title === 'string' && isHttpUrl(r?.url))
    .map((r) => ({
      title: cleanText(r.title!),
      url: r.url!,
      description: parseHighlights(r.description),
      source:
        typeof r.source === 'string'
          ? cleanText(r.source)
          : toSourceName(r.url, r.meta_url),
      age: typeof r.age === 'string' ? cleanText(r.age) : undefined,
      thumbnail: safeImageSrc(r.thumbnail?.src),
      favicon: safeImageSrc(r.meta_url?.favicon),
    }));
  return {
    vertical: 'news',
    page,
    hasMore: raw?.query?.more_results_available ?? results.length >= PAGE_SIZE,
    results,
  };
}

export function normalizeVideos(raw: BraveVideosResponse, page: number): VideosSearchData {
  const results = mapVideoItems(Array.isArray(raw?.results) ? raw.results : []);
  return {
    vertical: 'videos',
    page,
    hasMore: raw?.query?.more_results_available ?? results.length >= PAGE_SIZE,
    results,
  };
}

/** Returns the corrected query, or null when there is no real correction. */
export function normalizeSpellcheck(
  raw: BraveSpellcheckResponse,
  original: string,
): string | null {
  const first = Array.isArray(raw?.results) ? raw.results[0] : undefined;
  const corrected = typeof first?.query === 'string' ? cleanText(first.query) : '';
  if (!corrected) return null;
  if (corrected.toLowerCase() === original.trim().toLowerCase()) return null;
  return corrected;
}

/** Markdown **bold** → segments; links/headers/tags reduced to plain text. */
export function parseMarkdownBold(md: string): TextSegment[] {
  const plain = stripTags(md)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) → text
    .replace(/^#{1,6}\s+/gm, ''); // strip heading markers
  const segments: TextSegment[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(plain)) !== null) {
    if (m.index > last) {
      segments.push({ text: decodeEntities(plain.slice(last, m.index)), bold: false });
    }
    segments.push({ text: decodeEntities(m[1]), bold: true });
    last = m.index + m[0].length;
  }
  if (last < plain.length) {
    segments.push({ text: decodeEntities(plain.slice(last)), bold: false });
  }
  return segments.filter((s) => s.text.length > 0);
}

/** Extracts the grounded answer from an OpenAI-style chat completion. */
export function normalizeAnswer(raw: BraveChatCompletionsResponse): AnswerData | null {
  const content = Array.isArray(raw?.choices)
    ? raw.choices[0]?.message?.content
    : undefined;
  if (typeof content !== 'string' || !content.trim()) return null;
  const text = parseMarkdownBold(content.trim());
  if (text.length === 0) return null;
  return { text, followups: [] };
}

export function normalizeSuggest(raw: BraveSuggestResponse): string[] {
  const items = Array.isArray(raw?.results) ? raw.results : [];
  const seen = new Set<string>();
  return items
    .map((r) => (typeof r?.query === 'string' ? cleanText(r.query) : ''))
    .filter((q) => {
      if (!q || seen.has(q.toLowerCase())) return false;
      seen.add(q.toLowerCase());
      return true;
    })
    .slice(0, 8);
}
