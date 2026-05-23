import "server-only";

import { z } from "zod";

const optionalCsv = z
  .string()
  .optional()
  .transform((value) =>
    value
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : []
  );

const envSchema = z.object({
  CURSOR_API_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  DEFAULT_CURSOR_MODEL: z.string().trim().optional(),
  ALLOWED_GIT_HOSTS: optionalCsv.transform((hosts) =>
    hosts.length > 0 ? hosts : ["github.com"]
  ),
  ALLOWED_GITHUB_ORGS: optionalCsv,
  AGENT_RUN_RATE_LIMIT: z.coerce.number().int().positive().default(10),
  ALLOW_DEV_AUTH_BYPASS: z.string().optional(),
});

export function getEnv() {
  return envSchema.parse(process.env);
}

export function getCursorApiKey() {
  const apiKey = getEnv().CURSOR_API_KEY;

  if (!apiKey) {
    throw new Error("CURSOR_API_KEY is required for Cursor SDK operations.");
  }

  return apiKey;
}

export function isDevAuthBypassEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_DEV_AUTH_BYPASS === "true"
  );
}
