"use client";

import { useRouter } from "next/navigation";

import { runStatusFilters, runStatusLabels } from "@/lib/agent-runs/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AgentRunFilters({ activeStatus }: { activeStatus?: string }) {
  const router = useRouter();
  const value = activeStatus ?? "all";

  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        router.push(next === "all" ? "/runs" : `/runs?status=${next}`);
      }}
    >
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-0 border-b border-border/60 bg-transparent p-0"
      >
        <TabsTrigger
          value="all"
          className="rounded-none border-b-2 border-transparent px-3 py-2 data-active:border-foreground data-active:bg-transparent data-active:shadow-none"
        >
          All
        </TabsTrigger>
        {runStatusFilters.map((status) => (
          <TabsTrigger
            key={status}
            value={status}
            className="rounded-none border-b-2 border-transparent px-3 py-2 data-active:border-foreground data-active:bg-transparent data-active:shadow-none"
          >
            {runStatusLabels[status]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
