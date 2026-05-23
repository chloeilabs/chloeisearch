import Link from "next/link";

import { runStatusFilters, runStatusLabels } from "@/lib/agent-runs/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AgentRunFilters({ activeStatus }: { activeStatus?: string }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Run status filters">
      <Link
        href="/runs"
        className={cn(
          buttonVariants({
            variant: activeStatus ? "outline" : "default",
            size: "sm",
          })
        )}
      >
        All
      </Link>
      {runStatusFilters.map((status) => (
        <Link
          key={status}
          href={`/runs?status=${status}`}
          className={buttonVariants({
            variant: activeStatus === status ? "default" : "outline",
            size: "sm",
          })}
        >
          {runStatusLabels[status]}
        </Link>
      ))}
    </nav>
  );
}
