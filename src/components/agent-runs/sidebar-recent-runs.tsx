"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import type { AgentRun } from "@prisma/client";

import { RunSidebarIcon } from "@/components/agent-runs/run-sidebar-icon";
import { Input } from "@/components/ui/input";
import { groupRunsByRepository } from "@/lib/agent-runs/sidebar-groups";
import { formatRelativeTime } from "@/lib/format";
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

  const groups = useMemo(() => groupRunsByRepository(filtered), [filtered]);

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
            className="h-8 border-border/60 bg-background/40 pl-8 text-[13px] shadow-none"
            aria-label="Search agents"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2 scrollbar-fade">
        <Link
          href="/runs"
          className={cn(
            "mb-1 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors",
            onRunsIndex && !activeRunId
              ? "bg-sidebar-active text-sidebar-active-foreground"
              : "text-foreground/75 hover:bg-muted/50"
          )}
          aria-current={onRunsIndex && !activeRunId ? "page" : undefined}
        >
          Overview
        </Link>

        {runs.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">No agents yet.</p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">No matches.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {groups.map((group) => (
              <li key={group.id}>
                <details className="group/repo" open>
                  <summary className="flex cursor-pointer list-none items-center gap-1 px-2 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase marker:content-none [&::-webkit-details-marker]:hidden">
                    <ChevronDownIcon className="size-3 shrink-0 transition-transform group-open/repo:rotate-0 -rotate-90" />
                    <span className="truncate">{group.label}</span>
                    <span className="ml-auto tabular-nums opacity-60">
                      {group.runs.length}
                    </span>
                  </summary>
                  <ul className="mt-0.5 flex flex-col gap-px">
                    {group.runs.map((run) => {
                      const active = activeRunId === run.id;
                      const isRunning =
                        run.normalizedStatus === "creating" ||
                        run.normalizedStatus === "running";

                      return (
                        <li key={run.id}>
                          <Link
                            href={`/runs/${run.id}`}
                            className={cn(
                              "flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                              active
                                ? "bg-sidebar-active text-sidebar-active-foreground"
                                : "text-foreground/75 hover:bg-muted/50",
                              isRunning && !active && "opacity-90"
                            )}
                            aria-current={active ? "page" : undefined}
                          >
                            <span className="flex size-5 shrink-0 items-center justify-center">
                              <RunSidebarIcon
                                status={run.normalizedStatus}
                                hasPr={Boolean(run.prUrl)}
                              />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[13px] leading-5">
                              {run.taskSummary}
                            </span>
                            <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                              {formatRelativeTime(run.updatedAt)}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
