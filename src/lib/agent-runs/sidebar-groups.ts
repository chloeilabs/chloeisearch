import type { AgentRun } from "@prisma/client";

import { hostAndRepo } from "@/lib/format";

export type RunSidebarGroup = {
  id: string;
  label: string;
  runs: AgentRun[];
};

export function groupRunsByRepository(runs: AgentRun[]): RunSidebarGroup[] {
  const groups = new Map<string, RunSidebarGroup>();

  for (const run of runs) {
    const label = hostAndRepo(run.repoUrl) || "Unknown repository";
    const id = `repo:${label.toLowerCase()}`;
    const existing = groups.get(id);

    if (existing) {
      existing.runs.push(run);
      continue;
    }

    groups.set(id, { id, label, runs: [run] });
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );
}
