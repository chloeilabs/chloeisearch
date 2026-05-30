import type { AgentRun } from "@prisma/client";

import { AgentRunActions } from "@/components/agent-runs/agent-run-actions";
import { AgentStatusDot } from "@/components/agent-runs/agent-run-status-badge";
import { runStatusLabels } from "@/lib/agent-runs/types";
import type { NormalizedRunStatus } from "@/lib/cursor/status";
import { formatDateTime, hostAndRepo } from "@/lib/format";

export function AgentRunHeader({ run }: { run: AgentRun }) {
  const statusLabel =
    runStatusLabels[run.normalizedStatus as NormalizedRunStatus] ??
    run.normalizedStatus;

  return (
    <header className="border-b border-border/50 pb-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <AgentStatusDot status={run.normalizedStatus} className="size-2" />
            <span className="text-[11px] font-medium text-muted-foreground">
              {statusLabel}
            </span>
            {run.retryOfRunId ? (
              <span className="text-[11px] text-muted-foreground">· Retry</span>
            ) : null}
          </div>
          <h1 className="text-lg font-medium leading-snug tracking-tight">
            {run.taskSummary}
          </h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {hostAndRepo(run.repoUrl)} · {run.startingRef} ·{" "}
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
    </header>
  );
}
