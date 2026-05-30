import "server-only";

import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import {
  buildRunCreationLimits,
  type RunCreationLimits,
} from "@/lib/agent-runs/limit-policy";

const activeRunStatuses = ["creating", "running"];

export async function getRunCreationLimits(
  userId: string
): Promise<RunCreationLimits> {
  const env = getEnv();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const activeOnly = { userId, archivedAt: null } as const;

  const [activeRuns, runsLast24Hours] = await Promise.all([
    prisma.agentRun.count({
      where: {
        ...activeOnly,
        normalizedStatus: { in: activeRunStatuses },
      },
    }),
    prisma.agentRun.count({
      where: {
        ...activeOnly,
        createdAt: { gte: since },
      },
    }),
  ]);

  return buildRunCreationLimits(
    { activeRuns, runsLast24Hours },
    {
      activeLimit: env.AGENT_RUN_ACTIVE_LIMIT,
      dailyLimit: env.AGENT_RUN_DAILY_LIMIT,
      perMinuteLimit: env.AGENT_RUN_RATE_LIMIT,
    }
  );
}

export async function assertCanCreateAgentRun(userId: string) {
  const limits = await getRunCreationLimits(userId);

  if (!limits.canCreateRun) {
    throw new ApiError(429, limits.reasons.join(" "), limits);
  }

  return limits;
}
