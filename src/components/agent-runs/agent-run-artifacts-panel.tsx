import type { AgentRunArtifact } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

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
    <Card>
      <CardHeader>
        <CardTitle>Artifacts</CardTitle>
      </CardHeader>
      <CardContent>
        {artifacts.length === 0 ? (
          <Empty className="border bg-background">
            <EmptyHeader>
              <EmptyTitle>No artifacts stored</EmptyTitle>
              <EmptyDescription>
                Cursor artifact support depends on SDK/runtime availability.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {artifacts.map((artifact) => (
              <li
                key={artifact.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{artifact.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {artifact.artifactId}
                  </p>
                </div>
                <a
                  href={artifactHref(runId, artifact.artifactId)}
                  className="text-sm underline underline-offset-4"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
