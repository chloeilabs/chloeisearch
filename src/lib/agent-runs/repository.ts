import "server-only";

import type { AgentRun, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { NormalizedRunStatus } from "@/lib/cursor/status";

export type AgentRunWithRelations = Prisma.AgentRunGetPayload<{
  include: {
    events: { orderBy: { sequenceNumber: "asc" } };
    artifacts: { orderBy: { createdAt: "asc" } };
    retryOfRun: true;
    retries: true;
  };
}>;

export async function listRunsForUser(
  userId: string,
  status?: NormalizedRunStatus
) {
  return prisma.agentRun.findMany({
    where: {
      userId,
      ...(status ? { normalizedStatus: status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listRunsForBackgroundRefresh(limit = 10) {
  return prisma.agentRun.findMany({
    where: {
      normalizedStatus: { in: ["creating", "running"] },
      cursorAgentId: { not: null },
      cursorRunId: { not: null },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });
}

export async function getRunHealthStats(userId: string, staleAfterMinutes = 15) {
  const [totalRuns, activeRuns, failedRuns, staleActiveRuns, latestRun] =
    await Promise.all([
      prisma.agentRun.count({ where: { userId } }),
      prisma.agentRun.count({
        where: { userId, normalizedStatus: { in: ["creating", "running"] } },
      }),
      prisma.agentRun.count({
        where: { userId, normalizedStatus: "error" },
      }),
      prisma.agentRun.count({
        where: {
          userId,
          normalizedStatus: { in: ["creating", "running"] },
          updatedAt: { lt: new Date(Date.now() - staleAfterMinutes * 60 * 1000) },
        },
      }),
      prisma.agentRun.findFirst({
        where: {
          userId,
          cursorRunId: { not: null },
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          normalizedStatus: true,
          updatedAt: true,
        },
      }),
    ]);

  return {
    totalRuns,
    activeRuns,
    failedRuns,
    staleActiveRuns,
    latestRunRefresh: latestRun,
  };
}

export async function getRunOperationsActivity(userId: string) {
  const [latestCronEvent, latestRunEvent] = await Promise.all([
    prisma.agentRunEvent.findFirst({
      where: {
        eventType: {
          in: [
            "app.background_refresh_succeeded",
            "app.background_refresh_failed",
          ],
        },
        agentRun: { userId },
      },
      orderBy: { createdAt: "desc" },
      select: {
        eventType: true,
        messageText: true,
        createdAt: true,
        agentRun: {
          select: {
            id: true,
            normalizedStatus: true,
          },
        },
      },
    }),
    prisma.agentRunEvent.findFirst({
      where: {
        agentRun: { userId },
      },
      orderBy: { createdAt: "desc" },
      select: {
        eventType: true,
        messageText: true,
        createdAt: true,
        agentRun: {
          select: {
            id: true,
            normalizedStatus: true,
          },
        },
      },
    }),
  ]);

  return {
    latestCronEvent,
    latestRunEvent,
  };
}

export async function getRunForUser(userId: string, id: string) {
  return prisma.agentRun.findFirst({
    where: { id, userId },
  });
}

export async function getRunDetailForUser(userId: string, id: string) {
  return prisma.agentRun.findFirst({
    where: { id, userId },
    include: {
      events: { orderBy: { sequenceNumber: "asc" } },
      artifacts: { orderBy: { createdAt: "asc" } },
      retryOfRun: true,
      retries: true,
    },
  });
}

export async function createRunRecord(
  input: Pick<
    AgentRun,
    | "userId"
    | "repoUrl"
    | "startingRef"
    | "taskPrompt"
    | "taskSummary"
    | "modelId"
    | "autoCreatePR"
    | "idempotencyKey"
    | "retryOfRunId"
  >
) {
  return prisma.agentRun.create({
    data: {
      ...input,
      runtime: "cloud",
      normalizedStatus: "creating",
      rawCursorStatus: "CREATING",
    },
  });
}

export async function updateRunCursorIdentity(
  id: string,
  data: {
    cursorAgentId: string;
    cursorRunId: string;
    rawCursorStatus: string;
    normalizedStatus: NormalizedRunStatus;
  }
) {
  return prisma.agentRun.update({
    where: { id },
    data,
  });
}

export async function updateRunFailure(id: string, message: string) {
  return prisma.agentRun.update({
    where: { id },
    data: {
      normalizedStatus: "error",
      rawCursorStatus: "ERROR",
      errorMessage: message,
      completedAt: new Date(),
    },
  });
}

export async function updateRunFromCursorPayload(
  id: string,
  data: {
    normalizedStatus: NormalizedRunStatus;
    rawCursorStatus?: string;
    resultSummary?: string;
    resultRawPayload?: unknown;
    prUrl?: string;
    branchName?: string;
    errorMessage?: string;
  }
) {
  const completedAt =
    data.normalizedStatus === "finished" ||
    data.normalizedStatus === "error" ||
    data.normalizedStatus === "expired"
      ? new Date()
      : undefined;
  const cancelledAt =
    data.normalizedStatus === "cancelled" ? new Date() : undefined;

  return prisma.agentRun.update({
    where: { id },
    data: {
      normalizedStatus: data.normalizedStatus,
      rawCursorStatus: data.rawCursorStatus,
      resultSummary: data.resultSummary,
      resultRawPayload: data.resultRawPayload as Prisma.InputJsonValue,
      prUrl: data.prUrl,
      branchName: data.branchName,
      errorMessage: data.errorMessage,
      completedAt,
      cancelledAt,
    },
  });
}

export async function createRunEvent(input: {
  agentRunId: string;
  eventType: string;
  messageText?: string;
  rawPayload: unknown;
}) {
  const lastEvent = await prisma.agentRunEvent.aggregate({
    where: { agentRunId: input.agentRunId },
    _max: { sequenceNumber: true },
  });

  return prisma.agentRunEvent.create({
    data: {
      agentRunId: input.agentRunId,
      sequenceNumber: (lastEvent._max.sequenceNumber ?? 0) + 1,
      eventType: input.eventType,
      messageText: input.messageText,
      rawPayload: input.rawPayload as Prisma.InputJsonValue,
    },
  });
}

export async function listRunEventsForUser(userId: string, id: string) {
  return prisma.agentRunEvent.findMany({
    where: {
      agentRun: { id, userId },
    },
    orderBy: { sequenceNumber: "asc" },
  });
}

export async function replaceRunArtifacts(
  agentRunId: string,
  artifacts: Array<{
    artifactId: string;
    name: string;
    mimeType?: string;
    size?: number;
    previewUrl?: string;
    rawPayload: unknown;
  }>
) {
  await prisma.agentRunArtifact.deleteMany({ where: { agentRunId } });

  if (artifacts.length === 0) {
    return [];
  }

  await prisma.agentRunArtifact.createMany({
    data: artifacts.map((artifact) => ({
      ...artifact,
      agentRunId,
      rawPayload: artifact.rawPayload as Prisma.InputJsonValue,
    })),
  });

  return prisma.agentRunArtifact.findMany({
    where: { agentRunId },
    orderBy: { createdAt: "asc" },
  });
}
