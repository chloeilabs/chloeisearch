/**
 * TTL + LRU cache shared by every route handler and server component.
 * Anchored on globalThis so it survives Next.js dev-mode HMR module reloads;
 * a full process restart clears it (fine for local dev).
 */

interface Entry {
  value: unknown;
  expires: number;
}

const MAX_ENTRIES = 300;

declare global {
  var __braveCache: Map<string, Entry> | undefined;
}

// instanceof check (not just ??=): an HMR-surviving value from an older
// module version may have a different shape — never trust it blindly.
if (!(globalThis.__braveCache instanceof Map)) {
  globalThis.__braveCache = new Map();
}
const store: Map<string, Entry> = globalThis.__braveCache;

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  // Re-insert to mark as most-recently-used (Map preserves insertion order).
  store.delete(key);
  store.set(key, entry);
  return entry.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number): void {
  if (store.has(key)) {
    store.delete(key);
  } else if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
}
