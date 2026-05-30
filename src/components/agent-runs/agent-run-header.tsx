import type { AgentRun } from "@prisma/client";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { AgentRunActions } from "@/components/agent-runs/agent-run-actions";
import { AgentRunStatusBadge } from "@/components/agent-runs/agent-run-status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, hostAndRepo } from "@/lib/format";

export function AgentRunHeader({ run }: { run: AgentRun }) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <Link
          href="/runs"
          className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeftIcon className="size-3.5" />
          All agents
        </Link>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <AgentRunStatusBadge status={run.normalizedStatus} />
          <Badge variant="outline">{run.runtime}</Badge>
          {run.retryOfRunId ? <Badge variant="secondary">Retry</Badge> : null}
        </div>
        <h1 className="max-w-4xl text-xl font-medium leading-snug tracking-tight">
          {run.taskSummary}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
