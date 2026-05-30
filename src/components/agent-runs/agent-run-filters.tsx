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
      <TabsList className="h-auto flex-wrap">
        <TabsTrigger value="all">All</TabsTrigger>
        {runStatusFilters.map((status) => (
          <TabsTrigger key={status} value={status}>
            {runStatusLabels[status]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
