"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AgentRun } from "@prisma/client";

import { AgentStatusDot } from "@/components/agent-runs/agent-run-status-badge";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SidebarRecentRuns({ runs }: { runs: AgentRun[] }) {
  const pathname = usePathname();
  const activeRunId = pathname.match(/^\/runs\/([^/]+)$/)?.[1];
  const onRunsIndex = pathname === "/runs";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ul className="flex flex-1 flex-col gap-px overflow-y-auto px-1.5 py-1">
        <li>
          <Link
            href="/runs"
            className={cn(
              "cursor-sidebar-item",
              onRunsIndex && !activeRunId
                ? "cursor-sidebar-item-active"
                : "cursor-sidebar-item-inactive"
            )}
            aria-current={onRunsIndex && !activeRunId ? "page" : undefined}
          >
            <span className="text-[13px]">All agents</span>
          </Link>
        </li>
        {runs.map((run) => {
          const active = activeRunId === run.id;

          return (
            <li key={run.id}>
              <Link
                href={`/runs/${run.id}`}
                className={cn(
                  "cursor-sidebar-item gap-2",
                  active ? "cursor-sidebar-item-active" : "cursor-sidebar-item-inactive"
                )}
                aria-current={active ? "page" : undefined}
              >
                <AgentStatusDot status={run.normalizedStatus} />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 leading-snug">{run.taskSummary}</span>
                </span>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/80">
                  {formatRelativeTime(run.updatedAt)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
