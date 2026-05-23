import type { AgentRun } from "@prisma/client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AgentRunResultPanel({ run }: { run: AgentRun }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Result</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {run.errorMessage ? (
          <Alert>
            <AlertTitle>Error details</AlertTitle>
            <AlertDescription>{run.errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Branch
            </dt>
            <dd className="text-sm">{run.branchName ?? "Not available"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Pull request
            </dt>
            <dd className="break-words text-sm">
              {run.prUrl ? (
                <a
                  href={run.prUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  {run.prUrl}
                </a>
              ) : (
                "Not available"
              )}
            </dd>
          </div>
        </dl>
        <div>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">
            Summary
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-6">
            {run.resultSummary ?? "No final result has been stored yet."}
          </p>
        </div>
        {run.resultRawPayload ? (
          <details className="rounded-lg border bg-muted/40 p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Raw result JSON
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs">
              {JSON.stringify(run.resultRawPayload, null, 2)}
            </pre>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
