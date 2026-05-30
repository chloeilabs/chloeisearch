"use client";

import type { AgentRun } from "@prisma/client";

export async function patchAgentRun(
  runId: string,
  body: { taskSummary?: string; archived?: boolean }
) {
  const response = await fetch(`/api/agent-runs/${runId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as { run?: AgentRun; error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to update agent.");
  }

  if (!payload.run) {
    throw new Error("Unable to update agent.");
  }

  return payload.run;
}
