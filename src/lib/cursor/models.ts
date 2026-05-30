import "server-only";

import { Cursor, type SDKModel } from "@cursor/sdk";

import { getCursorRequestOptions } from "@/lib/cursor/client";

/** Matches cookbook agent-kanban catalog caching (~55s). */
const modelCacheTtlMs = 55_000;

const globalForModelCache = globalThis as typeof globalThis & {
  __chloeiCursorModelCache?: {
    loadedAt: number;
    models: SDKModel[];
  };
};

export async function listCursorModels(): Promise<SDKModel[]> {
  const cache = globalForModelCache.__chloeiCursorModelCache;
  if (cache && Date.now() - cache.loadedAt < modelCacheTtlMs) {
    return cache.models;
  }

  const models = [...(await Cursor.models.list(getCursorRequestOptions()))].sort(
    (a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, {
        sensitivity: "base",
      })
  );

  globalForModelCache.__chloeiCursorModelCache = {
    loadedAt: Date.now(),
    models,
  };

  return models;
}

export async function validateCursorModel(modelId?: string) {
  if (!modelId) {
    return undefined;
  }

  const models = await listCursorModels();
  const model = models.find((item) => item.id === modelId);

  if (!model) {
    throw new Error("Selected Cursor model is not available for this account.");
  }

  return model;
}
