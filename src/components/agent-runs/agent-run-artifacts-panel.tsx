import type { AgentRunArtifact } from "@prisma/client";

import { DetailSection } from "@/components/agent-runs/detail-section";

function artifactHref(runId: string, artifactId: string) {
  return `/api/agent-runs/${runId}/artifacts/${artifactId
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/")}`;
}

export function AgentRunArtifactsPanel({
  runId,
  artifacts,
}: {
  runId: string;
  artifacts: AgentRunArtifact[];
}) {
  return (
    <DetailSection title="Artifacts">
      {artifacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No artifacts yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {artifacts.map((artifact) => (
            <li
              key={artifact.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{artifact.name}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {artifact.artifactId}
                </p>
              </div>
              <a
                href={artifactHref(runId, artifact.artifactId)}
                className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}
