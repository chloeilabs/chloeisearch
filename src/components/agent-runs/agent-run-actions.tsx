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
  const [error, setError] = useState<string | null>(null);
  const terminal = isTerminalStatus(status);

  async function mutate(action: "refresh" | "cancel" | "retry") {
    setIsPending(action);
    setError(null);

    try {
      const response = await fetch(`/api/agent-runs/${runId}/${action}`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? `Unable to ${action} run.`);
      }

      if (action === "retry") {
        router.push(`/runs/${payload.run.id}`);
      }

      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setIsPending(null);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
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
        <Button
          variant="outline"
          onClick={() => void navigator.clipboard.writeText(prompt)}
        >
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
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
