import "server-only";

import { ApiError } from "@/lib/api";
import {
  cancelCloudAgentRun,
  createCloudAgentRun,
  getCloudAgentRun,
  listCloudAgentArtifacts,
  runToSerializablePayload,
  waitForCloudAgentRun,
} from "@/lib/cursor/agent-service";
import { getCursorEventMessage, getCursorEventType } from "@/lib/cursor/events";
import { validateCursorModel } from "@/lib/cursor/models";
import { artifactToRecord, extractRunResult } from "@/lib/cursor/results";
import {
  isTerminalStatus,
  normalizeCursorStatus,
} from "@/lib/cursor/status";
import { getEnv } from "@/lib/env";
import { assertCanCreateAgentRun } from "@/lib/agent-runs/limits";
import {
  createRunEvent,
  createRunRecord,
  getRunForUser,
  listRunsForBackgroundRefresh,
  replaceRunArtifacts,
  updateRunCursorIdentity,
  updateRunFailure,
  updateRunFromCursorPayload,
} from "@/lib/agent-runs/repository";
import type { CreateAgentRunInput } from "@/lib/validation/agent-run";
import {
  createCursorAgentName,
  summarizeTaskPrompt,
} from "@/lib/validation/agent-run";

export async function startAgentRun(
  userId: string,
  input: CreateAgentRunInput,
  retryOfRunId?: string
) {
  await assertCanCreateAgentRun(userId);

  const defaultModel = getEnv().DEFAULT_CURSOR_MODEL || undefined;
  const modelId = input.modelId ?? defaultModel;

  await validateCursorModel(modelId);

  const idempotencyKey = crypto.randomUUID();
  const record = await createRunRecord({
    userId,
    repoUrl: input.repoUrl,
    startingRef: input.startingRef,
    taskPrompt: input.taskPrompt,
    taskSummary: summarizeTaskPrompt(input.taskPrompt),
    modelId: modelId ?? null,
    autoCreatePR: input.autoCreatePR,
    idempotencyKey,
    retryOfRunId: retryOfRunId ?? null,
  });

  await createRunEvent({
    agentRunId: record.id,
    eventType: "app.run_created",
    messageText: "Run record created.",
    rawPayload: {
      repoUrl: input.repoUrl,
      startingRef: input.startingRef,
      modelId,
      autoCreatePR: input.autoCreatePR,
      retryOfRunId,
    },
  });

  try {
    const cursorRun = await createCloudAgentRun({
      name: createCursorAgentName(record.taskSummary),
      repoUrl: input.repoUrl,
      startingRef: input.startingRef,
      taskPrompt: input.taskPrompt,
      modelId,
      autoCreatePR: input.autoCreatePR,
      idempotencyKey,
    });

    const normalizedStatus = normalizeCursorStatus(cursorRun.rawCursorStatus);

    await createRunEvent({
      agentRunId: record.id,
      eventType: "cursor.run_started",
      messageText: `Cursor run ${cursorRun.cursorRunId} started.`,
      rawPayload: {
        cursorAgentId: cursorRun.cursorAgentId,
        cursorRunId: cursorRun.cursorRunId,
        rawCursorStatus: cursorRun.rawCursorStatus,
      },
    });

    return updateRunCursorIdentity(record.id, {
      cursorAgentId: cursorRun.cursorAgentId,
      cursorRunId: cursorRun.cursorRunId,
      rawCursorStatus: cursorRun.rawCursorStatus,
      normalizedStatus,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create Cursor run.";

    await createRunEvent({
      agentRunId: record.id,
      eventType: "app.run_create_failed",
      messageText: message,
      rawPayload: { message },
    });

    await updateRunFailure(record.id, message);
    throw error;
  }
}

export async function refreshAgentRun(userId: string, id: string) {
  const run = await getRunForUser(userId, id);

  if (!run) {
    throw new ApiError(404, "Run not found.");
  }

  if (!run.cursorAgentId || !run.cursorRunId) {
    return run;
  }

  const cursorRun = await getCloudAgentRun(run.cursorAgentId, run.cursorRunId);
  const normalizedStatus = normalizeCursorStatus(cursorRun.status);

  if (isTerminalStatus(normalizedStatus)) {
    const result = await waitForCloudAgentRun(run.cursorAgentId, run.cursorRunId);
    const extracted = extractRunResult(result);

    await updateRunFromCursorPayload(run.id, {
      normalizedStatus: normalizeCursorStatus(result.status),
      rawCursorStatus: result.status,
      resultSummary: extracted.resultSummary,
      resultRawPayload: extracted.resultRawPayload,
      prUrl: extracted.prUrl,
      branchName: extracted.branchName,
    });

    await syncRunArtifacts(run.id, run.cursorAgentId);
  } else {
    await updateRunFromCursorPayload(run.id, {
      normalizedStatus,
      rawCursorStatus: cursorRun.status,
      resultRawPayload: runToSerializablePayload(cursorRun),
      ...extractRunResult(cursorRun),
    });
  }

  return getRunForUser(userId, id);
}

export async function cancelAgentRun(userId: string, id: string) {
  const run = await getRunForUser(userId, id);

  if (!run) {
    throw new ApiError(404, "Run not found.");
  }

  if (!run.cursorAgentId || !run.cursorRunId) {
    throw new ApiError(409, "Run has not been created in Cursor yet.");
  }

  if (isTerminalStatus(run.normalizedStatus)) {
    return run;
  }

  await cancelCloudAgentRun(run.cursorAgentId, run.cursorRunId);

  await createRunEvent({
    agentRunId: run.id,
    eventType: "app.run_cancelled",
    messageText: "Cancellation requested.",
    rawPayload: { cursorAgentId: run.cursorAgentId, cursorRunId: run.cursorRunId },
  });

  return updateRunFromCursorPayload(run.id, {
    normalizedStatus: "cancelled",
    rawCursorStatus: "cancelled",
  });
}

export async function retryAgentRun(userId: string, id: string) {
  const run = await getRunForUser(userId, id);

  if (!run) {
    throw new ApiError(404, "Run not found.");
  }

  return startAgentRun(
    userId,
    {
      repoUrl: run.repoUrl,
      startingRef: run.startingRef,
      taskPrompt: run.taskPrompt,
      modelId: run.modelId ?? undefined,
      autoCreatePR: run.autoCreatePR,
    },
    run.id
  );
}

export async function persistCursorEvent(agentRunId: string, event: unknown) {
  const eventRecord = event as Record<string, unknown>;
  const eventType = getCursorEventType(eventRecord);
  const messageText = getCursorEventMessage(eventRecord);

  const persisted = await createRunEvent({
    agentRunId,
    eventType,
    messageText,
    rawPayload: eventRecord,
  });

  if (eventType === "status" && typeof eventRecord.status === "string") {
    await updateRunFromCursorPayload(agentRunId, {
      normalizedStatus: normalizeCursorStatus(eventRecord.status),
      rawCursorStatus: eventRecord.status,
    });
  }

  return persisted;
}

export async function finalizeRunFromCursor(agentRunId: string, agentId: string, runId: string) {
  const result = await waitForCloudAgentRun(agentId, runId);
  const extracted = extractRunResult(result);

  await updateRunFromCursorPayload(agentRunId, {
    normalizedStatus: normalizeCursorStatus(result.status),
    rawCursorStatus: result.status,
    resultSummary: extracted.resultSummary,
    resultRawPayload: extracted.resultRawPayload,
    prUrl: extracted.prUrl,
    branchName: extracted.branchName,
  });

  await syncRunArtifacts(agentRunId, agentId);

  return result;
}

export async function syncRunArtifacts(agentRunId: string, agentId: string) {
  try {
    const artifacts = await listCloudAgentArtifacts(agentId);
    return replaceRunArtifacts(agentRunId, artifacts.map(artifactToRecord));
  } catch {
    return [];
  }
}

export async function refreshActiveRunsForCron(
  limit = getEnv().CRON_REFRESH_BATCH_SIZE
) {
  const runs = await listRunsForBackgroundRefresh(limit);
  const results = [];

  for (const run of runs) {
    try {
      const refreshedRun = await refreshAgentRun(run.userId, run.id);

      results.push({
        id: run.id,
        status: refreshedRun?.normalizedStatus ?? run.normalizedStatus,
        ok: true,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected refresh failure.";

      try {
        await createRunEvent({
          agentRunId: run.id,
          eventType: "app.background_refresh_failed",
          messageText: message,
          rawPayload: {
            message,
            checkedAt: new Date().toISOString(),
          },
        });
      } catch {
        // Keep the cron response useful even if failure-event persistence fails.
      }

      results.push({
        id: run.id,
        status: run.normalizedStatus,
        ok: false,
        error: message,
      });
    }
  }

  return {
    checked: runs.length,
    results,
  };
}
