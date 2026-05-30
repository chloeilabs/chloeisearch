import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import type { AgentRun } from "@prisma/client";

import {
  AgentRunStatusBadge,
  AgentStatusDot,
} from "@/components/agent-runs/agent-run-status-badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime, hostAndRepo } from "@/lib/format";

export function AgentRunsTable({ runs }: { runs: AgentRun[] }) {
  if (runs.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">No agents yet.</p>
        <Button
          nativeButton={false}
          variant="outline"
          size="sm"
          className="mt-4"
          render={<Link href="/runs/new" />}
        >
          New agent
        </Button>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/50">
      {runs.map((run) => (
        <li key={run.id}>
          <Link
            href={`/runs/${run.id}`}
            className="group flex items-start gap-3 py-3.5 transition-colors hover:bg-accent/20"
          >
            <AgentStatusDot
              status={run.normalizedStatus}
              className="mt-1.5"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug text-foreground group-hover:text-foreground">
                {run.taskSummary}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span className="font-mono">{hostAndRepo(run.repoUrl)}</span>
                <span className="opacity-40">·</span>
                <span>{run.startingRef}</span>
                <span className="opacity-40">·</span>
                <span className="tabular-nums">
                  {formatRelativeTime(run.updatedAt)}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <AgentRunStatusBadge status={run.normalizedStatus} />
              {run.prUrl ? (
                <Button
                  variant="ghost"
                  size="xs"
                  nativeButton={false}
                  className="h-6 px-1.5 text-muted-foreground"
                  render={
                    <a
                      href={run.prUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    />
                  }
                >
                  <ExternalLinkIcon className="size-3" />
                  PR
                </Button>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
