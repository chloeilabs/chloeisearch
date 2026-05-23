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
  ALLOWED_GITHUB_USERS: optionalCsv,
  ALLOWED_EMAILS: optionalCsv.transform((emails) =>
    emails.map((email) => email.toLowerCase())
  ),
  AGENT_RUN_RATE_LIMIT: z.coerce.number().int().positive().default(10),
  AGENT_RUN_ACTIVE_LIMIT: z.coerce.number().int().nonnegative().default(3),
  AGENT_RUN_DAILY_LIMIT: z.coerce.number().int().nonnegative().default(25),
  CRON_REFRESH_BATCH_SIZE: z.coerce.number().int().positive().max(50).default(10),
  STALE_ACTIVE_RUN_MINUTES: z.coerce.number().int().positive().default(15),
  ALLOW_DEV_AUTH_BYPASS: z.string().optional(),
  CRON_SECRET: z.string().min(1).optional(),
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
