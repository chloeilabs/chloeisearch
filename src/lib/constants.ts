import type { Freshness, SafeSearch, Tab, Vertical } from './types';

export const PAGE_SIZE = 20; // Brave web/news/videos max count per request
export const MAX_PAGE = 10; // Brave offset is 0..9 → at most 10 pages
export const IMAGES_COUNT = 60; // images endpoint has no offset; fetch one large grid

// Google's tab order: All, Images, Videos, News.
export const TABS: { value: Tab; label: string; vertical: Vertical }[] = [
  { value: 'all', label: 'All', vertical: 'web' },
  { value: 'images', label: 'Images', vertical: 'images' },
  { value: 'videos', label: 'Videos', vertical: 'videos' },
  { value: 'news', label: 'News', vertical: 'news' },
];

export const TAB_TO_VERTICAL: Record<Tab, Vertical> = {
  all: 'web',
  images: 'images',
  news: 'news',
  videos: 'videos',
};

export const FRESHNESS_VALUES: readonly Freshness[] = ['pd', 'pw', 'pm', 'py'];

export const FRESHNESS_OPTIONS: { value: Freshness | ''; label: string }[] = [
  { value: '', label: 'Any time' },
  { value: 'pd', label: 'Past 24 hours' },
  { value: 'pw', label: 'Past week' },
  { value: 'pm', label: 'Past month' },
  { value: 'py', label: 'Past year' },
];

export const SAFESEARCH_VALUES: readonly SafeSearch[] = ['off', 'moderate', 'strict'];

export const SAFESEARCH_OPTIONS: { value: SafeSearch; label: string }[] = [
  { value: 'off', label: 'SafeSearch off' },
  { value: 'moderate', label: 'SafeSearch moderate' },
  { value: 'strict', label: 'SafeSearch strict' },
];

export const COUNTRIES: { value: string; label: string }[] = [
  { value: '', label: 'Any region' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'SE', label: 'Sweden' },
  { value: 'IN', label: 'India' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
];

/**
 * Per-vertical Brave API contract. The whitelist prevents 422s:
 * images rejects freshness/offset and only accepts safesearch off|strict.
 */
export const VERTICAL_CONFIG: Record<
  Vertical,
  {
    path: string;
    count: number;
    supportsOffset: boolean;
    supportsFreshness: boolean;
    mapSafeSearch: (s: SafeSearch) => string;
  }
> = {
  web: {
    path: '/res/v1/web/search',
    count: PAGE_SIZE,
    supportsOffset: true,
    supportsFreshness: true,
    mapSafeSearch: (s) => s,
  },
  images: {
    path: '/res/v1/images/search',
    count: IMAGES_COUNT,
    supportsOffset: false,
    supportsFreshness: false,
    mapSafeSearch: (s) => (s === 'off' ? 'off' : 'strict'),
  },
  news: {
    path: '/res/v1/news/search',
    count: PAGE_SIZE,
    supportsOffset: true,
    supportsFreshness: true,
    mapSafeSearch: (s) => s,
  },
  videos: {
    path: '/res/v1/videos/search',
    count: PAGE_SIZE,
    supportsOffset: true,
    supportsFreshness: true,
    mapSafeSearch: (s) => s,
  },
};
