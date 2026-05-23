import "server-only";

import {
  Agent,
  type Run,
  type RunResult,
  type SDKArtifact,
  type SDKMessage,
} from "@cursor/sdk";

import { getCursorApiKey } from "@/lib/env";
import { createCursorAgentName } from "@/lib/validation/agent-run";

export type CreateCloudAgentRunInput = {
  name: string;
  repoUrl: string;
  startingRef: string;
  taskPrompt: string;
  modelId?: string;
  autoCreatePR: boolean;
  idempotencyKey: string;
};

export async function createCloudAgentRun(input: CreateCloudAgentRunInput) {
  const apiKey = getCursorApiKey();
  const agent = await Agent.create({
    apiKey,
    name: createCursorAgentName(input.name),
    model: input.modelId ? { id: input.modelId } : undefined,
    cloud: {
      repos: [
        {
          url: input.repoUrl,
          startingRef: input.startingRef,
        },
      ],
      autoCreatePR: input.autoCreatePR,
    },
  });

  const run = await agent.send(input.taskPrompt, {
    idempotencyKey: input.idempotencyKey,
  });

  return {
    agent,
    run,
    cursorAgentId: run.agentId,
    cursorRunId: run.id,
    rawCursorStatus: run.status,
  };
}

export async function reconnectToRun(agentId: string, runId: string) {
  return Agent.getRun(runId, {
    runtime: "cloud",
    agentId,
    apiKey: getCursorApiKey(),
  });
}

export async function getCloudAgentRun(agentId: string, runId: string) {
  return reconnectToRun(agentId, runId);
}

export async function* streamCloudAgentRunEvents(
  agentId: string,
  runId: string
): AsyncGenerator<SDKMessage, void> {
  const run = await reconnectToRun(agentId, runId);

  for await (const event of run.stream()) {
    yield event;
  }
}

export async function waitForCloudAgentRun(
  agentId: string,
  runId: string
): Promise<RunResult> {
  const run = await reconnectToRun(agentId, runId);
  return run.wait();
}

export async function cancelCloudAgentRun(agentId: string, runId: string) {
  const run = await reconnectToRun(agentId, runId);

  if (run.supports("cancel")) {
    await run.cancel();
    return;
  }

  await Agent.cancelRun(runId, {
    runtime: "cloud",
    agentId,
    apiKey: getCursorApiKey(),
  });
}

export async function listCloudAgentArtifacts(
  agentId: string
): Promise<SDKArtifact[]> {
  const agent = await Agent.resume(agentId, { apiKey: getCursorApiKey() });
  return agent.listArtifacts();
}

export async function downloadCloudAgentArtifact(
  agentId: string,
  artifactPath: string
): Promise<Buffer> {
  const agent = await Agent.resume(agentId, { apiKey: getCursorApiKey() });
  return agent.downloadArtifact(artifactPath);
}

export function runToSerializablePayload(run: Run) {
  return {
    id: run.id,
    agentId: run.agentId,
    status: run.status,
    result: run.result,
    model: run.model,
    durationMs: run.durationMs,
    git: run.git,
    createdAt: run.createdAt,
  };
}
