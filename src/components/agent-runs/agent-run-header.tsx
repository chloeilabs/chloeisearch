import type { AgentRun } from "@prisma/client";

import { AgentRunActions } from "@/components/agent-runs/agent-run-actions";
import { RunSidebarIcon } from "@/components/agent-runs/run-sidebar-icon";
import { runStatusLabels } from "@/lib/agent-runs/types";
import type { NormalizedRunStatus } from "@/lib/cursor/status";
import { formatDateTime, hostAndRepo } from "@/lib/format";

export function AgentRunHeader({ run }: { run: AgentRun }) {
  const statusLabel =
    runStatusLabels[run.normalizedStatus as NormalizedRunStatus] ??
    run.normalizedStatus;

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <RunSidebarIcon
            status={run.normalizedStatus}
            hasPr={Boolean(run.prUrl)}
            className="mt-0.5 size-4"
          />
          <div className="min-w-0">
            <h1 className="text-lg font-medium tracking-tight leading-snug">
              {run.taskSummary}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              <span className="text-foreground/80">{statusLabel}</span>
              {" · "}
              {hostAndRepo(run.repoUrl)} from {run.startingRef}
              {" · "}
              created {formatDateTime(run.createdAt)}
              {run.retryOfRunId ? " · retry" : null}
            </p>
          </div>
        </div>
        <AgentRunActions
          runId={run.id}
          status={run.normalizedStatus}
          prUrl={run.prUrl}
          prompt={run.taskPrompt}
        />
      </div>
    </div>
  );
}
