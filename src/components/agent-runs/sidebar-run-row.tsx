"use client";

import Link from "next/link";
import type { AgentRun } from "@prisma/client";

import { useAgentsShell } from "@/components/agent-runs/agents-shell-context";
import { RunSidebarIcon } from "@/components/agent-runs/run-sidebar-icon";
import { RunSidebarPreview } from "@/components/agent-runs/run-sidebar-preview";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatRelativeTime } from "@/lib/format";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export function SidebarRunRow({
  run,
  active,
}: {
  run: AgentRun;
  active: boolean;
}) {
  const { closeMobileSidebar } = useAgentsShell();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const isRunning =
    run.normalizedStatus === "creating" || run.normalizedStatus === "running";

  const linkClassName = cn(
    "flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors",
    active
      ? "bg-sidebar-active text-sidebar-active-foreground"
      : "text-foreground/75 hover:bg-muted/50",
    isRunning && !active && "opacity-90"
  );

  const link = (
    <Link
      href={`/runs/${run.id}`}
      onClick={() => closeMobileSidebar()}
      className={linkClassName}
      aria-current={active ? "page" : undefined}
    >
      <span className="flex size-5 shrink-0 items-center justify-center">
        <RunSidebarIcon status={run.normalizedStatus} hasPr={Boolean(run.prUrl)} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] leading-5">
        {run.taskSummary}
      </span>
      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
        {formatRelativeTime(run.updatedAt)}
      </span>
    </Link>
  );

  if (isMobile) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        delay={500}
        closeDelay={100}
        render={link}
      />
      <TooltipContent
        side="right"
        align="start"
        sideOffset={12}
        className="w-72 max-w-[min(18rem,80vw)] border border-border bg-popover px-3 py-2.5 text-popover-foreground shadow-md [&_[data-slot=tooltip-arrow]]:hidden"
      >
        <RunSidebarPreview run={run} />
      </TooltipContent>
    </Tooltip>
  );
}
