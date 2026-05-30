import { z } from "zod";

import {
  taskSummaryMaxLength,
  truncateTaskSummary,
} from "@/lib/agent-runs/task-summary";
import { getEnv } from "@/lib/env";
import { normalizeRepositoryUrl } from "@/lib/validation/repository";

export {
  getValidRenameSummary,
  taskSummaryMaxLength,
} from "@/lib/agent-runs/task-summary";

export const cursorAgentNameMaxLength = 100;

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

export const updateAgentRunInputSchema = z
  .object({
    taskSummary: z
      .string()
      .trim()
      .min(1, "Summary is required.")
      .max(
        taskSummaryMaxLength,
        `Summary must be ${taskSummaryMaxLength} characters or fewer.`
      )
      .optional(),
    archived: z.boolean().optional(),
  })
  .refine(
    (value) => value.taskSummary !== undefined || value.archived !== undefined,
    { message: "Provide taskSummary or archived." }
  );

export type UpdateAgentRunInput = z.infer<typeof updateAgentRunInputSchema>;

export function parseUpdateAgentRunInput(input: unknown) {
  const parsed = updateAgentRunInputSchema.parse(input);
  return {
    ...(parsed.taskSummary !== undefined
      ? {
          taskSummary: parsed.taskSummary.replace(/\s+/g, " ").trim(),
        }
      : {}),
    ...(parsed.archived !== undefined ? { archived: parsed.archived } : {}),
  };
}

export function summarizeTaskPrompt(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();

  return truncateTaskSummary(normalized);
}

export function createCursorAgentName(summary: string) {
  const normalized = summary.replace(/\s+/g, " ").trim();

  return truncateTaskSummary(
    normalized || "Chloei Code task",
    cursorAgentNameMaxLength
  );
}
