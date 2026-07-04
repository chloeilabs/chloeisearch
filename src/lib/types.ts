// ---------------------------------------------------------------------------
// Strict internal types — what the UI renders. Produced by normalize.ts.
// ---------------------------------------------------------------------------

export type Vertical = 'web' | 'images' | 'news' | 'videos';
export type Tab = 'all' | 'images' | 'news' | 'videos';
export type Freshness = 'pd' | 'pw' | 'pm' | 'py';
export type SafeSearch = 'off' | 'moderate' | 'strict';

/** Canonical, validated search state. The URL is the source of truth for this. */
export interface SearchQuery {
  q: string;
  tab: Tab;
  /** 1-based, clamped to 1..MAX_PAGE. Always 1 for images (no offset support). */
  page: number;
  freshness?: Freshness;
  safesearch: SafeSearch;
  /** Uppercase 2-letter code from the curated list. */
  country?: string;
  /** True = search verbatim (spellcheck=0) — the "Search instead for" path. */
  nospell?: boolean;
}

/**
 * Brave descriptions arrive as HTML with <strong> around query hits.
 * We parse them into typed segments and render via React text nodes —
 * markup never reaches the DOM as HTML.
 */
export interface TextSegment {
  text: string;
  bold: boolean;
}

export interface WebResult {
  title: string;
  url: string;
  siteName?: string;
  /** Breadcrumb form: "example.com › docs › api" */
  displayUrl: string;
  description: TextSegment[];
  extraSnippets?: string[];
  favicon?: string;
  age?: string;
}

export interface ImageResult {
  title: string;
  /** Source page URL (where the image lives). */
  url: string;
  thumbnail: string;
  /** Full-size image URL (properties.url) for the preview panel. */
  fullSrc?: string;
  source?: string;
}

export interface NewsResult {
  title: string;
  url: string;
  description: TextSegment[];
  source?: string;
  age?: string;
  thumbnail?: string;
  favicon?: string;
}

export interface VideoResult {
  title: string;
  url: string;
  description?: string;
  thumbnail?: string;
  duration?: string;
  age?: string;
  source?: string;
}

/** Google-style knowledge panel, normalized from Brave's infobox. */
export interface KnowledgePanel {
  title: string;
  category?: string;
  description?: string;
  image?: string;
  website?: string;
  attributes: { label: string; value: string }[];
  profiles: { name: string; url: string }[];
}

interface SearchDataBase {
  page: number;
  hasMore: boolean;
  /** Server-measured duration of the (possibly cached) lookup. */
  tookMs?: number;
}

/** "People also ask" row, from the web response's faq block. */
export interface FaqItem {
  question: string;
  answer: TextSegment[];
  source?: string;
  url?: string;
}

/** Stock card data from the Rich Callback API. */
export interface StockData {
  symbol: string;
  name: string;
  exchange?: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  open?: number;
  high?: number;
  low?: number;
  marketCap?: number;
  peRatio?: number;
  week52High?: number;
  week52Low?: number;
  prevClose?: number;
  /** Intraday closes for the sparkline. */
  points: number[];
  provider?: string;
}

/** Weather card data from the Rich Callback API (OpenWeatherMap-backed). */
export interface WeatherData {
  location: string;
  tempC: number;
  feelsLikeC: number;
  description: string;
  icon?: string;
  humidity?: number;
  windKmh?: number;
  daily: { day: string; icon?: string; minC: number; maxC: number }[];
}

export interface WebSearchData extends SearchDataBase {
  vertical: 'web';
  results: WebResult[];
  infobox?: KnowledgePanel;
  /** Set when Brave auto-corrected the query ("Showing results for …"). */
  alteredQuery?: string;
  faq: FaqItem[];
  inlineVideos: VideoResult[];
  /** Rich-data hint (e.g. weather) to fetch via the Rich Callback API. */
  richHint?: { vertical: string; callbackKey: string };
}

export interface ImagesSearchData extends SearchDataBase {
  vertical: 'images';
  results: ImageResult[];
}

export interface NewsSearchData extends SearchDataBase {
  vertical: 'news';
  results: NewsResult[];
}

export interface VideosSearchData extends SearchDataBase {
  vertical: 'videos';
  results: VideoResult[];
}

/** Discriminated on `vertical` so the UI can narrow `results`. */
export type SearchData =
  | WebSearchData
  | ImagesSearchData
  | NewsSearchData
  | VideosSearchData;

export interface SuggestData {
  suggestions: string[];
  /** True when the key has no Suggest subscription — client falls back to local history. */
  disabled?: boolean;
}

/** AI answer from Brave's OpenAI-compatible AI Grounding endpoint. */
export interface AnswerData {
  /** Markdown bold parsed into segments; rendered as text nodes, never HTML. */
  text: TextSegment[];
  followups: string[];
}

// ---------------------------------------------------------------------------
// Loose shapes for raw Brave responses. Every field optional on purpose:
// schema drift must degrade to dropped fields/entries, never a crash.
// ---------------------------------------------------------------------------

export interface BraveMetaUrl {
  netloc?: string;
  hostname?: string;
  path?: string;
  favicon?: string;
}

export interface BraveWebItem {
  title?: string;
  url?: string;
  description?: string;
  age?: string;
  extra_snippets?: unknown[];
  profile?: { name?: string; img?: string };
  meta_url?: BraveMetaUrl;
}

export interface BraveInfoboxItem {
  title?: string;
  category?: string;
  long_desc?: string;
  website_url?: string;
  images?: { src?: string }[];
  /** Pairs of [label, htmlValue]; values contain HTML (<br>, links). */
  attributes?: unknown[];
  profiles?: { name?: string; url?: string }[];
}

export interface BraveWebResponse {
  query?: {
    original?: string;
    /** Present when Brave spell-corrected the query before searching. */
    altered?: string;
    more_results_available?: boolean;
  };
  web?: { results?: BraveWebItem[] };
  infobox?: { results?: BraveInfoboxItem[] };
  faq?: {
    results?: {
      question?: string;
      answer?: string;
      title?: string;
      url?: string;
      meta_url?: BraveMetaUrl;
    }[];
  };
  /** Inline video block mixed into web results (same item shape as the vertical). */
  videos?: { results?: BraveVideoItem[] };
  /** Present when enable_rich_callback=1 and rich data (weather etc.) exists. */
  rich?: { hint?: { vertical?: string; callback_key?: string } };
}

/** Loose shape of GET /res/v1/web/rich responses. */
export interface BraveRichResponse {
  results?: {
    subtype?: string;
    provider?: { name?: string };
    stock?: {
      asset_info?: { symbol?: string; name?: string; exchange?: string; currency?: string };
      quote?: {
        symbol?: string;
        company_name?: string;
        primary_exchange?: string;
        currency?: string;
        latest_price?: number;
        change?: number;
        change_percent?: number;
        open?: number;
        high?: number;
        low?: number;
        close?: number;
        market_cap?: number;
        pe_ratio?: number;
        week_52_high?: number;
        week_52_low?: number;
      };
      timeseries?: { timeseries?: { close?: number }[] };
    };
    weather?: {
      location?: { name?: string; state?: string; country?: string };
      current_weather?: {
        temp?: number;
        feels_like?: number;
        humidity?: number;
        wind?: { speed?: number };
        weather?: { description?: string; main?: string; icon?: string };
      };
      daily?: {
        date_i18n?: string;
        temperature?: { min?: number; max?: number };
        weather?: { icon?: string };
      }[];
    };
  }[];
}

export interface BraveImageItem {
  title?: string;
  url?: string;
  source?: string;
  thumbnail?: { src?: string };
  properties?: { url?: string };
}

export interface BraveImagesResponse {
  results?: BraveImageItem[];
}

export interface BraveNewsItem {
  title?: string;
  url?: string;
  description?: string;
  age?: string;
  source?: string;
  meta_url?: BraveMetaUrl;
  thumbnail?: { src?: string };
}

export interface BraveNewsResponse {
  query?: { more_results_available?: boolean };
  results?: BraveNewsItem[];
}

export interface BraveVideoItem {
  title?: string;
  url?: string;
  description?: string;
  age?: string;
  thumbnail?: { src?: string };
  video?: { duration?: string; creator?: string; publisher?: string };
  meta_url?: BraveMetaUrl;
}

export interface BraveVideosResponse {
  query?: { more_results_available?: boolean };
  results?: BraveVideoItem[];
}

export interface BraveSuggestResponse {
  results?: { query?: string }[];
}

export interface BraveSpellcheckResponse {
  query?: { original?: string };
  results?: { query?: string }[];
}

/** OpenAI-compatible response from /res/v1/chat/completions (AI Grounding). */
export interface BraveChatCompletionsResponse {
  choices?: { message?: { content?: unknown } }[];
}
