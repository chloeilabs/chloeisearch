import type { AgentRun } from "@prisma/client";

import { AgentRunActions } from "@/components/agent-runs/agent-run-actions";
import { AgentRunStatusBadge } from "@/components/agent-runs/agent-run-status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, hostAndRepo } from "@/lib/format";

export function AgentRunHeader({ run }: { run: AgentRun }) {
  return (
    <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <AgentRunStatusBadge status={run.normalizedStatus} />
          <Badge variant="outline">{run.runtime}</Badge>
          {run.retryOfRunId ? <Badge variant="secondary">Retry</Badge> : null}
        </div>
        <h1 className="max-w-4xl text-2xl font-semibold leading-tight">
          {run.taskSummary}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {hostAndRepo(run.repoUrl)} from {run.startingRef} · created{" "}
          {formatDateTime(run.createdAt)}
        </p>
      </div>
      <AgentRunActions
        runId={run.id}
        status={run.normalizedStatus}
        prUrl={run.prUrl}
        prompt={run.taskPrompt}
      />
    </div>
  );
}
