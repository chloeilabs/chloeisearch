import type { AgentRunArtifact } from "@prisma/client";

import { DetailSection } from "@/components/agent-runs/detail-section";
import {
  getArtifactPreviewKind,
  isInlineArtifactPreview,
} from "@/lib/cursor/artifact-preview";

function artifactHref(runId: string, artifactId: string, inline = false) {
  const base = `/api/agent-runs/${runId}/artifacts/${artifactId
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/")}`;

  return inline ? `${base}?inline=1` : base;
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
        <ul className="flex flex-col gap-2">
          {artifacts.map((artifact) => {
            const previewKind = getArtifactPreviewKind(artifact.artifactId);
            const inline = isInlineArtifactPreview(previewKind);
            const mediaUrl = artifactHref(runId, artifact.artifactId, true);

            return (
              <li
                key={artifact.id}
                className="rounded-md border border-border/40 px-3 py-2"
              >
                {inline ? (
                  <div className="mb-2 overflow-hidden rounded-md border border-border/40 bg-muted/20">
                    {previewKind === "video" ? (
                      <video
                        src={mediaUrl}
                        controls
                        className="max-h-48 w-full bg-black/40"
                        preload="metadata"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- authenticated artifact proxy
                      <img
                        src={mediaUrl}
                        alt={artifact.name}
                        className="max-h-48 w-full object-contain"
                      />
                    )}
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
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
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DetailSection>
  );
}
