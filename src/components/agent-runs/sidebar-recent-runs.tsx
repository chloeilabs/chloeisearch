"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AgentRun } from "@prisma/client";

import { AgentRunStatusBadge } from "@/components/agent-runs/agent-run-status-badge";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SidebarRecentRuns({ runs }: { runs: AgentRun[] }) {
  const pathname = usePathname();
  const activeRunId = pathname.match(/^\/runs\/([^/]+)$/)?.[1];

  if (runs.length === 0) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-sidebar-border">
      <p className="cursor-sidebar-label">Recent</p>
      <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
        {runs.map((run) => {
          const active = activeRunId === run.id;

          return (
            <li key={run.id}>
              <Link
                href={`/runs/${run.id}`}
                className={cn(
                  "block rounded-md px-2.5 py-2 transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="line-clamp-2 text-xs leading-snug text-foreground/95">
                  {run.taskSummary}
                </span>
                <span className="mt-1.5 flex items-center justify-between gap-2">
                  <AgentRunStatusBadge
                    status={run.normalizedStatus}
                    className="h-5 px-1.5 text-[10px]"
                  />
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {formatRelativeTime(run.updatedAt)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
