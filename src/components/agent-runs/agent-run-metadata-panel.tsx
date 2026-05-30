import type { AgentRun } from "@prisma/client";

import { DetailSection } from "@/components/agent-runs/detail-section";
import { AgentRunStatusBadge } from "@/components/agent-runs/agent-run-status-badge";
import { formatDateTime, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AgentRunMetadataPanel({ run }: { run: AgentRun }) {
  const items = [
    ["Repository", run.repoUrl],
    ["Starting ref", run.startingRef],
    ["Model", run.modelId ?? "Default"],
    ["Cursor agent", run.cursorAgentId ?? "—"],
    ["Cursor run", run.cursorRunId ?? "—"],
    ["Raw status", run.rawCursorStatus ?? "—"],
    ["Auto PR", run.autoCreatePR ? "On" : "Off"],
    ["Created", formatDateTime(run.createdAt)],
    ["Updated", formatDateTime(run.updatedAt)],
    ["Completed", formatDateTime(run.completedAt)],
    ["Elapsed", formatDuration(run.createdAt, run.completedAt)],
  ] as const;

  return (
    <DetailSection title="Details">
      <dl className="grid gap-3">
        <div>
          <dt className="text-[11px] font-medium text-muted-foreground">Status</dt>
          <dd className="mt-1">
            <AgentRunStatusBadge status={run.normalizedStatus} />
          </dd>
        </div>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
            <dd
              className={cn(
                "mt-0.5 break-words text-sm text-foreground/90",
                label === "Repository" && "font-mono text-xs"
              )}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </DetailSection>
  );
}
