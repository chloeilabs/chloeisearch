"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  Clock3Icon,
  ExternalLinkIcon,
  GitBranchIcon,
  GitPullRequestIcon,
  ListChecksIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";

import { DetailSection } from "@/components/agent-runs/detail-section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PullRequestLifecycle } from "@/lib/github/pull-requests";

type PullRequestResponse = {
  pullRequest: PullRequestLifecycle | null;
  error?: string;
};

type CleanupResponse = {
  pullRequest: PullRequestLifecycle;
  closedPullRequest: boolean;
  deletedBranch: boolean;
  error?: string;
};

export function AgentRunPullRequestPanel({
  runId,
  prUrl,
  initialPullRequest,
  initialError,
}: {
  runId: string;
  prUrl?: string | null;
  initialPullRequest: PullRequestLifecycle | null;
  initialError?: string | null;
}) {
  const [pullRequest, setPullRequest] = useState(initialPullRequest);
  const [error, setError] = useState(initialError ?? null);
  const [pendingAction, setPendingAction] = useState<"refresh" | "cleanup" | null>(
    null
  );
  const autoRefreshAttempts = useRef(0);
  const canCleanUp =
    pullRequest &&
    (pullRequest.state === "open" || pullRequest.branch.canDelete);
  const linkedPrUrl = pullRequest?.url ?? prUrl;

  const refreshPullRequest = useCallback(async function refreshPullRequest() {
    setPendingAction("refresh");
    setError(null);

    try {
      const response = await fetch(`/api/agent-runs/${runId}/pull-request`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as PullRequestResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to refresh pull request.");
      }

      setPullRequest(payload.pullRequest);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to refresh pull request."
      );
    } finally {
      setPendingAction(null);
    }
  }, [runId]);

  useEffect(() => {
    const shouldRefreshMissingLifecycle = Boolean(linkedPrUrl && !pullRequest);
    const shouldRefreshPendingChecks = Boolean(
      pullRequest &&
        pullRequest.state === "open" &&
        pullRequest.checks.pending > 0
    );

    if (
      (!shouldRefreshMissingLifecycle && !shouldRefreshPendingChecks) ||
      autoRefreshAttempts.current >= 2
    ) {
      return;
    }

    const delayMs = autoRefreshAttempts.current === 0 ? 15_000 : 45_000;
    const timer = window.setTimeout(() => {
      autoRefreshAttempts.current += 1;
      void refreshPullRequest();
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [linkedPrUrl, pullRequest, refreshPullRequest]);

  async function cleanupPullRequest() {
    if (!pullRequest) {
      return;
    }

    const confirmed = window.confirm(
      "Close this pull request and delete its matching head branch when safe?"
    );

    if (!confirmed) {
      return;
    }

    setPendingAction("cleanup");
    setError(null);

    try {
      const response = await fetch(
        `/api/agent-runs/${runId}/pull-request/cleanup`,
        { method: "POST" }
      );
      const payload = (await response.json()) as CleanupResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to clean up pull request.");
      }

      setPullRequest(payload.pullRequest);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to clean up pull request."
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <DetailSection
      title="Pull request"
      action={
        <div className="flex gap-0.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 px-0"
            onClick={() => void refreshPullRequest()}
            disabled={pendingAction !== null}
            aria-label="Refresh pull request"
          >
            <RefreshCwIcon
              className={cn(
                "size-3.5",
                pendingAction === "refresh" && "animate-spin"
              )}
            />
          </Button>
          {linkedPrUrl ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 px-0"
              nativeButton={false}
              render={
                <a href={linkedPrUrl} target="_blank" rel="noreferrer" />
              }
              aria-label="Open pull request"
            >
              <ExternalLinkIcon className="size-3.5" />
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon data-icon="inline-start" />
            <AlertTitle>Pull request unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!pullRequest && linkedPrUrl ? (
          <Alert>
            <GitPullRequestIcon data-icon="inline-start" />
            <AlertTitle>Pull request linked</AlertTitle>
            <AlertDescription>
              The run has a pull request URL, but lifecycle details are not
              loaded yet. Refresh to retry GitHub metadata.
            </AlertDescription>
          </Alert>
        ) : !pullRequest ? (
          <Empty className="min-h-44">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GitPullRequestIcon />
              </EmptyMedia>
              <EmptyTitle>No pull request linked</EmptyTitle>
              <EmptyDescription>
                Cursor has not returned a pull request URL for this run.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <PullRequestSummary pullRequest={pullRequest} />
            <PullRequestValidation pullRequest={pullRequest} />
            <PullRequestBlockers pullRequest={pullRequest} />
            <PullRequestChecks pullRequest={pullRequest} />
            <PullRequestReviews pullRequest={pullRequest} />
            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <Button
                type="button"
                variant="destructive"
                onClick={() => void cleanupPullRequest()}
                disabled={!canCleanUp || pendingAction !== null}
              >
                <Trash2Icon data-icon="inline-start" />
                Cleanup PR
              </Button>
              <p className="text-xs text-muted-foreground">
                Closes the PR and deletes only the matching run branch.
              </p>
            </div>
          </>
        )}
      </div>
    </DetailSection>
  );
}

function PullRequestSummary({
  pullRequest,
}: {
  pullRequest: PullRequestLifecycle;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={pullRequest.state === "open" ? "default" : "secondary"}>
          <GitPullRequestIcon data-icon="inline-start" />
          {pullRequest.state}
        </Badge>
        {pullRequest.merged ? <Badge variant="secondary">Merged</Badge> : null}
        {pullRequest.isDraft ? <Badge variant="outline">Draft</Badge> : null}
        {pullRequest.state === "open" ? (
          <Badge variant="outline">
            {pullRequest.mergeState ?? "merge state n/a"}
          </Badge>
        ) : null}
        <ValidationBadge status={pullRequest.validation.status} />
      </div>
      <div>
        <a
          href={pullRequest.url}
          target="_blank"
          rel="noreferrer"
          className="font-medium underline-offset-4 hover:underline"
        >
          #{pullRequest.number} {pullRequest.title}
        </a>
        <p className="mt-1 text-xs text-muted-foreground">
          {pullRequest.repository} · {pullRequest.baseRef} ←{" "}
          {pullRequest.headRef} · updated {formatDateTime(pullRequest.updatedAt)}
        </p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Metric label="Changed files" value={pullRequest.changedFiles} />
        <Metric
          label="Diff"
          value={`+${pullRequest.additions} / -${pullRequest.deletions}`}
        />
        <Metric
          label="Required checks"
          value={
            pullRequest.branchProtection.available
              ? pullRequest.branchProtection.requiredStatusChecks.length || "None"
              : "Unavailable"
          }
        />
        <Metric
          label="Required approvals"
          value={pullRequest.branchProtection.requiredApprovingReviewCount}
        />
      </dl>
      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <GitBranchIcon className="size-4" />
          Branch cleanup
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={pullRequest.branch.exists ? "outline" : "secondary"}>
            {pullRequest.branch.exists ? "Branch exists" : "Branch deleted"}
          </Badge>
          <span className="font-mono text-xs">{pullRequest.branch.name}</span>
        </div>
        {pullRequest.branch.deleteBlockedReason ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {pullRequest.branch.deleteBlockedReason}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PullRequestValidation({
  pullRequest,
}: {
  pullRequest: PullRequestLifecycle;
}) {
  const validation = pullRequest.validation;

  if (validation.status === "not_applicable") {
    return null;
  }

  if (validation.status === "passed") {
    return (
      <Alert>
        <ListChecksIcon data-icon="inline-start" />
        <AlertTitle>Validation passed</AlertTitle>
        <AlertDescription>{validation.summary}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant={validation.status === "warning" ? "destructive" : "default"}>
      <AlertTriangleIcon data-icon="inline-start" />
      <AlertTitle>
        {validation.status === "warning"
          ? "Validation needs review"
          : "Validation unavailable"}
      </AlertTitle>
      <AlertDescription>
        <div className="flex flex-col gap-2">
          <p>{validation.summary}</p>
          {validation.warnings.length > 0 ? (
            <ul className="list-disc pl-4">
              {validation.warnings.map((warning, index) => (
                <li key={`${warning.code}-${warning.path ?? index}`}>
                  <span>{warning.message}</span>
                  {warning.expectedPreview || warning.actualPreview ? (
                    <span className="mt-1 block font-mono text-xs">
                      {warning.expectedPreview
                        ? `Expected: ${warning.expectedPreview}`
                        : null}
                      {warning.expectedPreview && warning.actualPreview
                        ? " · "
                        : null}
                      {warning.actualPreview
                        ? `Actual: ${warning.actualPreview}`
                        : null}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </AlertDescription>
    </Alert>
  );
}

function PullRequestBlockers({
  pullRequest,
}: {
  pullRequest: PullRequestLifecycle;
}) {
  if (pullRequest.blockers.length === 0) {
    return (
      <Alert>
        <CheckCircle2Icon data-icon="inline-start" />
        <AlertTitle>No merge blockers detected</AlertTitle>
        <AlertDescription>
          GitHub checks and review metadata do not show a current blocker.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <AlertTriangleIcon data-icon="inline-start" />
      <AlertTitle>Merge blockers</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4">
          {pullRequest.blockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

function PullRequestChecks({
  pullRequest,
}: {
  pullRequest: PullRequestLifecycle;
}) {
  const visibleChecks = pullRequest.checks.items.slice(0, 6);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Checks</h3>
        <span className="text-xs text-muted-foreground">
          {pullRequest.checks.passed} passed · {pullRequest.checks.pending}{" "}
          pending · {pullRequest.checks.failed} failed
        </span>
      </div>
      {visibleChecks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No checks reported yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibleChecks.map((check) => (
            <li
              key={`${check.name}-${check.status}-${check.conclusion ?? ""}`}
              className="flex min-w-0 items-center justify-between gap-3 rounded-lg border px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <CheckIcon state={check.state} />
                <span className="truncate text-sm">{check.name}</span>
              </div>
              <Badge variant="outline">{check.conclusion ?? check.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PullRequestReviews({
  pullRequest,
}: {
  pullRequest: PullRequestLifecycle;
}) {
  const visibleComments = pullRequest.reviewComments.items.slice(0, 3);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Review</h3>
        <span className="text-xs text-muted-foreground">
          {pullRequest.reviews.approvals} approvals ·{" "}
          {pullRequest.reviews.changesRequested} changes ·{" "}
          {pullRequest.reviewComments.total} comments
        </span>
      </div>
      {visibleComments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No inline review comments found.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibleComments.map((comment) => (
            <li key={comment.id} className="rounded-lg border px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{comment.authorLogin ?? "reviewer"}</Badge>
                <a
                  href={comment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  {comment.path}
                  {comment.line ? `:${comment.line}` : ""}
                </a>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ValidationBadge({
  status,
}: {
  status: PullRequestLifecycle["validation"]["status"];
}) {
  switch (status) {
    case "passed":
      return (
        <Badge variant="secondary">
          <ListChecksIcon data-icon="inline-start" />
          Validated
        </Badge>
      );
    case "warning":
      return <Badge variant="destructive">Needs review</Badge>;
    case "unavailable":
      return <Badge variant="outline">Validation unavailable</Badge>;
    default:
      return null;
  }
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

function CheckIcon({
  state,
}: {
  state: PullRequestLifecycle["checks"]["items"][number]["state"];
}) {
  switch (state) {
    case "passed":
      return <CheckCircle2Icon className="size-4 text-emerald-600" />;
    case "pending":
      return <Clock3Icon className="size-4 text-amber-600" />;
    case "neutral":
      return <ShieldCheckIcon className="size-4 text-muted-foreground" />;
    default:
      return <AlertTriangleIcon className="size-4 text-destructive" />;
  }
}
