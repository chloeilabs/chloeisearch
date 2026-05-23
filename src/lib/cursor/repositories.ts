import "server-only";

import { Cursor, type SDKRepository } from "@cursor/sdk";

import { getCursorRequestOptions } from "@/lib/cursor/client";

export async function listCursorRepositories(): Promise<SDKRepository[]> {
  const repositories = await Cursor.repositories.list(getCursorRequestOptions());

  return [...repositories].sort((a, b) => a.url.localeCompare(b.url));
}
