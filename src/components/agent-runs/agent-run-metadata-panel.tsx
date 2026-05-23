import type { AgentRun } from "@prisma/client";

import { AgentRunStatusBadge } from "@/components/agent-runs/agent-run-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatDuration } from "@/lib/format";

const metadataLabelClassName = "text-xs font-medium text-muted-foreground";
const metadataValueClassName = "break-words text-sm";

export function AgentRunMetadataPanel({ run }: { run: AgentRun }) {
  const items = [
    ["Repository", run.repoUrl],
    ["Starting ref", run.startingRef],
    ["Model", run.modelId ?? "Cursor account default"],
    ["Cursor agent ID", run.cursorAgentId ?? "Not created"],
    ["Cursor run ID", run.cursorRunId ?? "Not created"],
    ["Raw Cursor status", run.rawCursorStatus ?? "Unknown"],
    ["Auto-create PR", run.autoCreatePR ? "Enabled" : "Disabled"],
    ["Created", formatDateTime(run.createdAt)],
    ["Updated", formatDateTime(run.updatedAt)],
    ["Completed", formatDateTime(run.completedAt)],
    ["Elapsed", formatDuration(run.createdAt, run.completedAt)],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <dt className={metadataLabelClassName}>Normalized status</dt>
            <dd>
              <AgentRunStatusBadge status={run.normalizedStatus} />
            </dd>
          </div>
          {items.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className={metadataLabelClassName}>{label}</dt>
              <dd className={metadataValueClassName}>{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
