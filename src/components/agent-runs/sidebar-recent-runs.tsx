"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";
import type { AgentRun } from "@prisma/client";

import { AgentStatusDot } from "@/components/agent-runs/agent-run-status-badge";
import { Input } from "@/components/ui/input";
import { formatRelativeTime, hostAndRepo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SidebarRecentRuns({ runs }: { runs: AgentRun[] }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const activeRunId = pathname.match(/^\/runs\/([^/]+)$/)?.[1];
  const onRunsIndex = pathname === "/runs";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return runs;
    }

    return runs.filter((run) => {
      const haystack = [
        run.taskSummary,
        run.repoUrl,
        run.startingRef,
        run.normalizedStatus,
        run.modelId ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [query, runs]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="px-2 pb-2">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search agents…"
            className="h-8 cursor-field pl-8 text-[13px] shadow-none"
            aria-label="Search agents"
          />
        </div>
      </div>

      <ul className="flex flex-1 flex-col gap-px overflow-y-auto px-1.5 pb-1">
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
            <span className="text-[13px]">Overview</span>
          </Link>
        </li>
        {runs.length > 0 ? (
          <li className="px-2.5 pb-0.5 pt-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
              {query.trim() ? `Matches (${filtered.length})` : "Agents"}
            </span>
          </li>
        ) : null}
        {filtered.length === 0 && query.trim() ? (
          <li className="px-2.5 py-3 text-xs text-muted-foreground">No matches</li>
        ) : null}
        {filtered.map((run) => {
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
                title={hostAndRepo(run.repoUrl)}
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
