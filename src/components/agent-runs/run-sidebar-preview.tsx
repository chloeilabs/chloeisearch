import type { AgentRun } from "@prisma/client";
import { GitBranchIcon, ExternalLinkIcon } from "lucide-react";

import { RunSidebarIcon } from "@/components/agent-runs/run-sidebar-icon";
import { runStatusLabels } from "@/lib/agent-runs/types";
import type { NormalizedRunStatus } from "@/lib/cursor/status";
import { formatDateTime, hostAndRepo } from "@/lib/format";

export function RunSidebarPreview({ run }: { run: AgentRun }) {
  const statusLabel =
    runStatusLabels[run.normalizedStatus as NormalizedRunStatus] ??
    run.normalizedStatus;

  return (
    <div className="space-y-2 text-left">
      <p className="text-sm font-medium leading-snug text-popover-foreground">
        {run.taskSummary}
      </p>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <RunSidebarIcon status={run.normalizedStatus} hasPr={Boolean(run.prUrl)} />
        <span>{statusLabel}</span>
        {run.prUrl ? (
          <a
            href={run.prUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 hover:text-foreground"
            onClick={(event) => event.stopPropagation()}
          >
            <ExternalLinkIcon className="size-3" />
            PR
          </a>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <GitBranchIcon className="size-3.5 shrink-0 opacity-70" />
        <span className="truncate font-mono text-[11px]">
          {hostAndRepo(run.repoUrl)} · {run.startingRef}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Updated {formatDateTime(run.updatedAt)}
      </p>
    </div>
  );
}
