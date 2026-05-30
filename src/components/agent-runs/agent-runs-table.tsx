import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import type { AgentRun } from "@prisma/client";

import { AgentRunStatusBadge, statusRailClassName } from "@/components/agent-runs/agent-run-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, hostAndRepo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AgentRunsTable({ runs }: { runs: AgentRun[] }) {
  if (runs.length === 0) {
    return (
      <Empty className="cursor-panel py-12">
        <EmptyHeader>
          <EmptyTitle>No runs yet</EmptyTitle>
          <EmptyDescription>
            Create a Cursor cloud agent run to start tracking work here.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/runs/new" />}>
            Create first run
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="cursor-panel overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[34%]">Task</TableHead>
            <TableHead>Repository</TableHead>
            <TableHead>Ref</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">PR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id} className="relative">
              <TableCell>
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-0 h-full w-1",
                    statusRailClassName(run.normalizedStatus)
                  )}
                />
                <Link
                  href={`/runs/${run.id}`}
                  className="block min-w-0 font-medium hover:underline"
                >
                  <span className="line-clamp-2">{run.taskSummary}</span>
                </Link>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Created {formatDateTime(run.createdAt)}
                </span>
              </TableCell>
              <TableCell className="max-w-[220px] truncate">
                {hostAndRepo(run.repoUrl)}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{run.startingRef}</Badge>
              </TableCell>
              <TableCell className="max-w-[160px] truncate">
                {run.modelId ?? "Cursor default"}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <AgentRunStatusBadge status={run.normalizedStatus} />
                  {run.rawCursorStatus ? (
                    <span className="text-xs text-muted-foreground">
                      raw: {run.rawCursorStatus}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{formatDateTime(run.updatedAt)}</TableCell>
              <TableCell className="text-right">
                {run.prUrl ? (
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={
                      <a href={run.prUrl} target="_blank" rel="noreferrer" />
                    }
                  >
                    <ExternalLinkIcon data-icon="inline-start" />
                    PR
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
