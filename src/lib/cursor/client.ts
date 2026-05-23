import "server-only";

import { getCursorApiKey } from "@/lib/env";

export function getCursorRequestOptions() {
  return { apiKey: getCursorApiKey() };
}
