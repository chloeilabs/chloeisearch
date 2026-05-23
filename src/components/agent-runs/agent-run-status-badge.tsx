import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  normalizeCursorStatus,
  type NormalizedRunStatus,
} from "@/lib/cursor/status";
import { runStatusLabels } from "@/lib/agent-runs/types";

const statusClassName: Record<NormalizedRunStatus, string> = {
  creating: "border-[var(--status-creating-border)] bg-[var(--status-creating-bg)] text-[var(--status-creating-fg)]",
  running: "border-[var(--status-running-border)] bg-[var(--status-running-bg)] text-[var(--status-running-fg)]",
  finished: "border-[var(--status-finished-border)] bg-[var(--status-finished-bg)] text-[var(--status-finished-fg)]",
  error: "border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--status-error-fg)]",
  cancelled: "border-[var(--status-cancelled-border)] bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled-fg)]",
  expired: "border-[var(--status-expired-border)] bg-[var(--status-expired-bg)] text-[var(--status-expired-fg)]",
};

export function AgentRunStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const normalized = normalizeCursorStatus(status);

  return (
    <Badge
      variant="outline"
      className={cn(statusClassName[normalized], className)}
    >
      {runStatusLabels[normalized]}
    </Badge>
  );
}

export function statusRailClassName(status: string) {
  const normalized = normalizeCursorStatus(status);

  return {
    creating: "bg-[var(--status-creating-fg)]",
    running: "bg-[var(--status-running-fg)]",
    finished: "bg-[var(--status-finished-fg)]",
    error: "bg-[var(--status-error-fg)]",
    cancelled: "bg-[var(--status-cancelled-fg)]",
    expired: "bg-[var(--status-expired-fg)]",
  }[normalized];
}
