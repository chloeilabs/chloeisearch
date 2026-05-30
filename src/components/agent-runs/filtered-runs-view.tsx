"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import type { AgentRun } from "@prisma/client";

import { AgentRunsTable } from "@/components/agent-runs/agent-runs-table";
import { Input } from "@/components/ui/input";

export function FilteredRunsView({
  runs,
  showUnarchive = false,
}: {
  runs: AgentRun[];
  showUnarchive?: boolean;
}) {
  const [query, setQuery] = useState("");

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
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            showUnarchive
              ? "Search archived agents…"
              : "Search filtered agents…"
          }
          className="cursor-field h-8 pl-8 text-[13px]"
          aria-label={
            showUnarchive ? "Search archived agents" : "Search filtered agents"
          }
        />
      </div>
      {query.trim() && filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No agents match your search.
        </p>
      ) : (
        <AgentRunsTable runs={filtered} showUnarchive={showUnarchive} />
      )}
    </div>
  );
}
