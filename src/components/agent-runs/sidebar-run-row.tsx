"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentRun } from "@prisma/client";
import {
  ArchiveIcon,
  CopyIcon,
  ExternalLinkIcon,
  PencilIcon,
} from "lucide-react";

import { useAgentsShell } from "@/components/agent-runs/agents-shell-context";
import { RunSidebarIcon } from "@/components/agent-runs/run-sidebar-icon";
import { RunSidebarPreview } from "@/components/agent-runs/run-sidebar-preview";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { patchAgentRun } from "@/lib/agent-runs/client-patch";
import { getValidRenameSummary } from "@/lib/agent-runs/task-summary";
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
  const router = useRouter();
  const pathname = usePathname();
  const { closeMobileSidebar } = useAgentsShell();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renamePending, setRenamePending] = useState(false);
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  const isRunning =
    run.normalizedStatus === "creating" || run.normalizedStatus === "running";

  const beginRename = useCallback(() => {
    setRenameValue(run.taskSummary);
    setIsRenaming(true);
  }, [run.taskSummary]);

  useEffect(() => {
    if (!isRenaming || !renameInputRef.current) {
      return;
    }

    renameInputRef.current.focus();
    renameInputRef.current.select();
  }, [isRenaming]);

  const linkClassName = cn(
    "flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors",
    active
      ? "bg-sidebar-active text-sidebar-active-foreground"
      : "text-foreground/75 hover:bg-muted/50",
    isRunning && !active && "opacity-90",
    isHovered && !isRenaming && !isMobile && "pr-[4.75rem]"
  );

  const handleCancelRename = useCallback(() => {
    setRenamePending(false);
    setIsRenaming(false);
  }, []);

  const handleFinishRename = useCallback(async () => {
    const nextSummary = getValidRenameSummary({
      draftSummary: renameValue,
      originalSummary: run.taskSummary,
    });

    if (!nextSummary) {
      handleCancelRename();
      return;
    }

    setRenamePending(true);

    try {
      await patchAgentRun(run.id, { taskSummary: nextSummary });
      router.refresh();
    } catch (error) {
      console.error("Failed to rename agent run:", error);
    } finally {
      setRenamePending(false);
      setIsRenaming(false);
    }
  }, [handleCancelRename, renameValue, run.id, run.taskSummary, router]);

  async function copyRunLink() {
    const url = `${window.location.origin}/runs/${run.id}`;

    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error("Failed to copy run link:", error);
    }
  }

  async function archiveRun() {
    try {
      await patchAgentRun(run.id, { archived: true });
      if (pathname === `/runs/${run.id}`) {
        router.push("/runs");
      }
      router.refresh();
    } catch (error) {
      console.error("Failed to archive agent run:", error);
    }
  }

  const showActionButtons = isHovered && !isRenaming && !isMobile;

  const actionButtons = showActionButtons ? (
    <span className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              aria-label="Rename agent"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                beginRename();
              }}
            >
              <PencilIcon className="size-3.5" />
            </button>
          }
        />
        <TooltipContent side="top" sideOffset={4}>
          Rename
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              aria-label="Copy link to agent"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void copyRunLink();
              }}
            >
              <CopyIcon className="size-3.5" />
            </button>
          }
        />
        <TooltipContent side="top" sideOffset={4}>
          Copy link
        </TooltipContent>
      </Tooltip>
      {run.prUrl ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                href={run.prUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                aria-label="Open pull request"
                onClick={(event) => event.stopPropagation()}
              >
                <ExternalLinkIcon className="size-3.5" />
              </a>
            }
          />
          <TooltipContent side="top" sideOffset={4}>
            Open PR
          </TooltipContent>
        </Tooltip>
      ) : null}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              aria-label="Archive agent"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void archiveRun();
              }}
            >
              <ArchiveIcon className="size-3.5" />
            </button>
          }
        />
        <TooltipContent side="top" sideOffset={4}>
          Archive
        </TooltipContent>
      </Tooltip>
    </span>
  ) : null;

  const rowInner = isRenaming ? (
    <div
      className={cn(
        linkClassName,
        !active && "bg-muted/50",
        renamePending && "opacity-80"
      )}
    >
      <span className="flex size-5 shrink-0 items-center justify-center">
        <RunSidebarIcon status={run.normalizedStatus} hasPr={Boolean(run.prUrl)} />
      </span>
      <input
        ref={renameInputRef}
        value={renameValue}
        onChange={(event) => setRenameValue(event.target.value)}
        onBlur={() => {
          void handleFinishRename();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void handleFinishRename();
          } else if (event.key === "Escape") {
            event.preventDefault();
            handleCancelRename();
          }
        }}
        disabled={renamePending}
        maxLength={120}
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] leading-5 text-foreground outline-none"
        aria-label="Agent summary"
      />
    </div>
  ) : (
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
      {!showActionButtons ? (
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
          {formatRelativeTime(run.updatedAt)}
        </span>
      ) : null}
    </Link>
  );

  const rowShell = (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {rowInner}
      {actionButtons}
    </div>
  );

  if (isMobile || isRenaming) {
    return rowShell;
  }

  return (
    <Tooltip>
      <TooltipTrigger delay={500} closeDelay={100} render={rowShell} />
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
