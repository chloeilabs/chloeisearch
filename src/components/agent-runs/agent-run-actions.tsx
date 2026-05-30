"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CopyIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SquareIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { isTerminalStatus } from "@/lib/cursor/status";

export function AgentRunActions({
  runId,
  status,
  prUrl,
  prompt,
}: {
  runId: string;
  status: string;
  prUrl?: string | null;
  prompt: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState<string | null>(null);
  const terminal = isTerminalStatus(status);

  async function mutate(action: "refresh" | "cancel" | "retry") {
    setIsPending(action);

    try {
      const response = await fetch(`/api/agent-runs/${runId}/${action}`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? `Unable to ${action} run.`);
      }

      if (action === "refresh") {
        toast.success("Run refreshed");
      } else if (action === "cancel") {
        toast.success("Cancellation requested");
      } else if (action === "retry") {
        toast.success("Retry started");
        router.push(`/runs/${payload.run.id}`);
      }

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Action failed."
      );
    } finally {
      setIsPending(null);
    }
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copied");
    } catch {
      toast.error("Unable to copy prompt");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => void mutate("refresh")}
        disabled={isPending !== null}
      >
        <RefreshCwIcon
          data-icon="inline-start"
          className={isPending === "refresh" ? "animate-spin" : ""}
        />
        Refresh
      </Button>
      <Button
        variant="destructive"
        onClick={() => void mutate("cancel")}
        disabled={terminal || isPending !== null}
      >
        <SquareIcon data-icon="inline-start" />
        Cancel
      </Button>
      <Button
        variant="outline"
        onClick={() => void mutate("retry")}
        disabled={isPending !== null}
      >
        <RotateCcwIcon data-icon="inline-start" />
        Retry
      </Button>
      <Button variant="outline" onClick={() => void copyPrompt()}>
        <CopyIcon data-icon="inline-start" />
        Copy prompt
      </Button>
      {prUrl ? (
        <Button
          nativeButton={false}
          render={<a href={prUrl} target="_blank" rel="noreferrer" />}
        >
          <ExternalLinkIcon data-icon="inline-start" />
          Open PR
        </Button>
      ) : null}
    </div>
  );
}
