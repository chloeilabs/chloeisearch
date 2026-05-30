import Link from "next/link";
import { MessageSquareIcon, PlusIcon } from "lucide-react";
import type { AgentRun } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatRelativeTime, hostAndRepo } from "@/lib/format";

export function AgentsHome({ runs }: { runs: AgentRun[] }) {
  const latest = runs[0];

  if (!latest) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareIcon />
            </EmptyMedia>
            <EmptyTitle>Select an agent</EmptyTitle>
            <EmptyDescription>
              Choose an agent from the sidebar to continue, or start a new one.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/runs/new" />}>
              <PlusIcon data-icon="inline-start" />
              New agent
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageSquareIcon />
          </EmptyMedia>
          <EmptyTitle>Select an agent</EmptyTitle>
          <EmptyDescription>
            Choose an agent from the sidebar, or continue your latest run.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="w-full max-w-md">
          <Link
            href={`/runs/${latest.id}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-4 py-3 text-left transition-colors hover:bg-muted/40"
          >
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-sm font-medium leading-snug">
                {latest.taskSummary}
              </span>
              <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                {hostAndRepo(latest.repoUrl)} · {formatRelativeTime(latest.updatedAt)}
              </span>
            </span>
          </Link>
          <Button
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="mt-3 text-muted-foreground"
            render={<Link href="/runs/new" />}
          >
            <PlusIcon data-icon="inline-start" />
            New agent
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
