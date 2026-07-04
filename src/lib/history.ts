/**
 * Recent-searches persistence (localStorage). Powers the suggest dropdown's
 * history rows and the whole dropdown when the API key lacks a Suggest
 * subscription. Client-side only; all functions no-op on the server.
 */

const KEY = 'search-history';
const MAX_ITEMS = 20;

export function loadHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_ITEMS)
      : [];
  } catch {
    return [];
  }
}

export function saveToHistory(q: string): void {
  if (typeof window === 'undefined') return;
  const query = q.trim();
  if (!query) return;
  try {
    const items = loadHistory().filter(
      (item) => item.toLowerCase() !== query.toLowerCase(),
    );
    items.unshift(query);
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // storage full or blocked — history is best-effort
  }
}

export function removeFromHistory(q: string): void {
  if (typeof window === 'undefined') return;
  try {
    const items = loadHistory().filter(
      (item) => item.toLowerCase() !== q.trim().toLowerCase(),
    );
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // best-effort
  }
}

export function historyMatches(prefix: string, limit: number): string[] {
  const p = prefix.trim().toLowerCase();
  return loadHistory()
    .filter((item) => (p ? item.toLowerCase().startsWith(p) && item.toLowerCase() !== p : true))
    .slice(0, limit);
}
