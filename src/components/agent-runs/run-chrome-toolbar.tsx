"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CopyIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { patchAgentRun } from "@/lib/agent-runs/client-patch";

export function RunChromeToolbar({
  runId,
  prUrl,
  archivedAt,
}: {
  runId: string;
  prUrl?: string | null;
  archivedAt?: Date | string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState<string | null>(null);
  const archived = Boolean(archivedAt);

  async function toggleArchive() {
    setPending("archive");
    try {
      await patchAgentRun(runId, { archived: !archived });
      if (!archived && pathname === `/runs/${runId}`) {
        router.push("/runs");
      }
      router.refresh();
    } catch (error) {
      console.error("Failed to update archive state:", error);
    } finally {
      setPending(null);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/runs/${runId}`
      );
    } catch (error) {
      console.error("Failed to copy run link:", error);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Refresh page"
              disabled={pending !== null}
              onClick={() => router.refresh()}
            >
              <RefreshCwIcon className="size-4" />
            </Button>
          }
        />
        <TooltipContent side="bottom">Refresh</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Copy link to agent"
              disabled={pending !== null}
              onClick={() => void copyLink()}
            >
              <CopyIcon className="size-4" />
            </Button>
          }
        />
        <TooltipContent side="bottom">Copy link</TooltipContent>
      </Tooltip>
      {prUrl ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                nativeButton={false}
                variant="ghost"
                size="icon-sm"
                aria-label="Open pull request"
                render={<Link href={prUrl} target="_blank" rel="noreferrer" />}
              >
                <ExternalLinkIcon className="size-4" />
              </Button>
            }
          />
          <TooltipContent side="bottom">Open PR</TooltipContent>
        </Tooltip>
      ) : null}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={archived ? "Unarchive agent" : "Archive agent"}
              disabled={pending !== null}
              onClick={() => void toggleArchive()}
            >
              {archived ? (
                <ArchiveRestoreIcon
                  className={pending === "archive" ? "size-4 animate-pulse" : "size-4"}
                />
              ) : (
                <ArchiveIcon
                  className={pending === "archive" ? "size-4 animate-pulse" : "size-4"}
                />
              )}
            </Button>
          }
        />
        <TooltipContent side="bottom">
          {archived ? "Unarchive" : "Archive"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
