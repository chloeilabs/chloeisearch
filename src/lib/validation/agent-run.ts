import { z } from "zod";

import { getEnv } from "@/lib/env";
import { normalizeRepositoryUrl } from "@/lib/validation/repository";

export const cursorAgentNameMaxLength = 100;
export const taskSummaryMaxLength = 120;

const startingRefSchema = z
  .string()
  .trim()
  .min(1, "Starting ref is required.")
  .max(200, "Starting ref is too long.")
  .regex(/^[^\s~^:?*[\\]+$/, "Starting ref contains invalid characters.");

export const createAgentRunInputSchema = z.object({
  repoUrl: z.string().trim().min(1, "Repository URL is required."),
  startingRef: startingRefSchema.default("main"),
  taskPrompt: z
    .string()
    .trim()
    .min(1, "Task prompt is required.")
    .max(20_000, "Task prompt must be 20,000 characters or fewer."),
  modelId: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value ? value : undefined)),
  autoCreatePR: z.boolean().default(true),
});

export type CreateAgentRunInput = z.infer<typeof createAgentRunInputSchema>;

export function parseCreateAgentRunInput(input: unknown) {
  const parsed = createAgentRunInputSchema.parse(input);
  const env = getEnv();

  return {
    ...parsed,
    repoUrl: normalizeRepositoryUrl(parsed.repoUrl, {
      allowedHosts: env.ALLOWED_GIT_HOSTS,
      allowedGithubOrgs: env.ALLOWED_GITHUB_ORGS.map((org) =>
        org.toLowerCase()
      ),
    }),
  };
}

export function summarizeTaskPrompt(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();

  return truncateWithEllipsis(normalized, taskSummaryMaxLength);
}

export function createCursorAgentName(summary: string) {
  const normalized = summary.replace(/\s+/g, " ").trim();

  return truncateWithEllipsis(normalized || "Chloei Code task", cursorAgentNameMaxLength);
}

function truncateWithEllipsis(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
