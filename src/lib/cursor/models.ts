import "server-only";

import { Cursor, type SDKModel } from "@cursor/sdk";

import { getCursorRequestOptions } from "@/lib/cursor/client";

export async function listCursorModels(): Promise<SDKModel[]> {
  const models = await Cursor.models.list(getCursorRequestOptions());

  return [...models].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, {
      sensitivity: "base",
    })
  );
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
