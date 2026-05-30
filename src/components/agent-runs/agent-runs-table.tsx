import Link from "next/link";
import { ChevronRightIcon, ExternalLinkIcon } from "lucide-react";
import type { AgentRun } from "@prisma/client";

import {
  AgentRunStatusBadge,
  statusRailClassName,
} from "@/components/agent-runs/agent-run-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatDateTime, formatRelativeTime, hostAndRepo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AgentRunsTable({ runs }: { runs: AgentRun[] }) {
  if (runs.length === 0) {
    return (
      <Empty className="cursor-panel py-12">
        <EmptyHeader>
          <EmptyTitle>No agents yet</EmptyTitle>
          <EmptyDescription>
            Launch a cloud agent on a repository — same runtime as Cursor.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/runs/new" />}>
            New agent
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="cursor-panel divide-y divide-border/50 overflow-hidden">
      <div className="hidden items-center gap-4 border-b border-border/60 bg-muted/20 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(140px,180px)_100px_110px_72px_24px]">
        <span>Task</span>
        <span>Repository</span>
        <span>Branch</span>
        <span>Status</span>
        <span>PR</span>
        <span className="sr-only">Open</span>
      </div>
      <ul>
        {runs.map((run) => (
          <li key={run.id} className="cursor-agent-row relative">
            <span
              aria-hidden
              className={cn(
                "absolute left-0 top-0 h-full w-0.5",
                statusRailClassName(run.normalizedStatus)
              )}
            />
            <div className="grid gap-3 px-4 py-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(140px,180px)_100px_110px_72px_24px] lg:items-center lg:gap-4">
              <Link href={`/runs/${run.id}`} className="min-w-0 pr-2 lg:col-span-1">
                <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:underline">
                  {run.taskSummary}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {formatRelativeTime(run.updatedAt)}
                  </span>
                  <span className="mx-1.5 opacity-40">·</span>
                  <span>created {formatDateTime(run.createdAt)}</span>
                </p>
              </Link>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {hostAndRepo(run.repoUrl)}
              </p>
              <div>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {run.startingRef}
                </Badge>
              </div>
              <div>
                <AgentRunStatusBadge status={run.normalizedStatus} />
              </div>
              <div>
                {run.prUrl ? (
                  <Button
                    variant="outline"
                    size="xs"
                    nativeButton={false}
                    className="h-7"
                    render={
                      <a href={run.prUrl} target="_blank" rel="noreferrer" />
                    }
                  >
                    <ExternalLinkIcon data-icon="inline-start" />
                    PR
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <Link
                href={`/runs/${run.id}`}
                className="hidden text-muted-foreground hover:text-foreground lg:flex lg:justify-end"
                aria-label={`Open run ${run.taskSummary}`}
              >
                <ChevronRightIcon className="size-4" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
