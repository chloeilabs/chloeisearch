import "server-only";

import { Cursor, type SDKRepository } from "@cursor/sdk";

import { getCursorRequestOptions } from "@/lib/cursor/client";

/** Matches cookbook agent-kanban repository list cache (~55s). */
const repositoryCacheTtlMs = 55_000;

const globalForRepositoryCache = globalThis as typeof globalThis & {
  __chloeiCursorRepositoryCache?: {
    loadedAt: number;
    repositories: SDKRepository[];
  };
};

export async function listCursorRepositories(): Promise<SDKRepository[]> {
  const cache = globalForRepositoryCache.__chloeiCursorRepositoryCache;
  if (cache && Date.now() - cache.loadedAt < repositoryCacheTtlMs) {
    return cache.repositories;
  }

  const repositories = [...(await Cursor.repositories.list(getCursorRequestOptions()))].sort(
    (a, b) => a.url.localeCompare(b.url)
  );

  globalForRepositoryCache.__chloeiCursorRepositoryCache = {
    loadedAt: Date.now(),
    repositories,
  };

  return repositories;
}
