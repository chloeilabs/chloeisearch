import type { AgentRun } from "@prisma/client";

import { DetailSection } from "@/components/agent-runs/detail-section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AgentRunResultPanel({ run }: { run: AgentRun }) {
  return (
    <DetailSection title="Result">
      <div className="flex flex-col gap-4">
        {run.errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{run.errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        {(run.branchName || run.prUrl) && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {run.branchName ? (
              <div>
                <dt className="text-[11px] font-medium text-muted-foreground">
                  Branch
                </dt>
                <dd className="mt-0.5 font-mono text-xs">{run.branchName}</dd>
              </div>
            ) : null}
            {run.prUrl ? (
              <div>
                <dt className="text-[11px] font-medium text-muted-foreground">
                  Pull request
                </dt>
                <dd className="mt-0.5 break-all">
                  <a
                    href={run.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline underline-offset-4"
                  >
                    Open PR
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        )}
        <div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {run.resultSummary ?? "No result yet."}
          </p>
        </div>
        {run.resultRawPayload ? (
          <details>
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Raw JSON
            </summary>
            <pre className="cursor-log-surface mt-2 max-h-64 overflow-auto">
              {JSON.stringify(run.resultRawPayload, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    </DetailSection>
  );
}
