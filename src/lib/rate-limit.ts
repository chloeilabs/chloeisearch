import "server-only";

import { ApiError } from "@/lib/api";
import { getEnv } from "@/lib/env";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const windowMs = 60_000;

export function assertRateLimit(key: string, limit = getEnv().AGENT_RUN_RATE_LIMIT) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (bucket.count >= limit) {
    throw new ApiError(429, "Rate limit exceeded. Try again shortly.");
  }

  bucket.count += 1;
}
