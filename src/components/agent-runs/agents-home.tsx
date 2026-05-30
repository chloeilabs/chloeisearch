import Link from "next/link";
import { ArrowRightIcon, PlusIcon } from "lucide-react";
import type { AgentRun } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { formatRelativeTime, hostAndRepo } from "@/lib/format";

export function AgentsHome({ runs }: { runs: AgentRun[] }) {
  const latest = runs[0];

  if (!latest) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">No cloud agents yet.</p>
        <Button
          nativeButton={false}
          className="mt-5"
          render={<Link href="/runs/new" />}
        >
          <PlusIcon data-icon="inline-start" />
          New agent
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <p className="max-w-sm text-sm text-muted-foreground">
        Select an agent from the sidebar, or continue your latest run.
      </p>
      <Link
        href={`/runs/${latest.id}`}
        className="mt-6 flex w-full max-w-md items-center gap-3 rounded-md border border-border/60 bg-card/30 px-4 py-3 text-left transition-colors hover:bg-accent/30"
      >
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm text-foreground">
            {latest.taskSummary}
          </span>
          <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
            {hostAndRepo(latest.repoUrl)} · {formatRelativeTime(latest.updatedAt)}
          </span>
        </span>
        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </Link>
      <Button
        nativeButton={false}
        variant="ghost"
        size="sm"
        className="mt-4 text-muted-foreground"
        render={<Link href="/runs/new" />}
      >
        <PlusIcon data-icon="inline-start" />
        New agent
      </Button>
    </div>
  );
}
