import "server-only";

import { ApiError } from "@/lib/api";
import {
  createRunEvent,
  getRunForUser,
} from "@/lib/agent-runs/repository";
import {
  cleanupGitHubPullRequest,
  getGitHubPullRequestLifecycle,
} from "@/lib/github/pull-requests";
import { logError, logInfo } from "@/lib/observability/logger";

export async function getRunPullRequestLifecycle(userId: string, runId: string) {
  const run = await getRunForUser(userId, runId);

  if (!run) {
    throw new ApiError(404, "Run not found.");
  }

  if (!run.prUrl) {
    return null;
  }

  try {
    const pullRequest = await getGitHubPullRequestLifecycle(userId, run);

    logInfo("github.pr_lifecycle.loaded", {
      userId,
      runId: run.id,
      prUrl: run.prUrl,
      pullRequestState: pullRequest.state,
      pendingChecks: pullRequest.checks.pending,
      failedChecks: pullRequest.checks.failed,
    });

    return pullRequest;
  } catch (error) {
    logError("github.pr_lifecycle.failed", error, {
      userId,
      runId: run.id,
      prUrl: run.prUrl,
    });
    throw error;
  }
}

export async function cleanupRunPullRequest(userId: string, runId: string) {
  const run = await getRunForUser(userId, runId);

  if (!run) {
    throw new ApiError(404, "Run not found.");
  }

  if (!run.prUrl) {
    throw new ApiError(409, "This run does not have a pull request URL.");
  }

  let result;

  try {
    result = await cleanupGitHubPullRequest(userId, run);
  } catch (error) {
    logError("github.pr_cleanup.failed", error, {
      userId,
      runId: run.id,
      prUrl: run.prUrl,
      branchName: run.branchName ?? null,
    });
    throw error;
  }

  const actions = [
    result.closedPullRequest ? "closed pull request" : null,
    result.deletedBranch ? "deleted branch" : null,
  ].filter(Boolean);

  await createRunEvent({
    agentRunId: run.id,
    eventType: "github.pr_cleanup",
    messageText:
      actions.length > 0
        ? `GitHub cleanup completed: ${actions.join(", ")}.`
        : "GitHub cleanup checked the PR; no changes were needed.",
    rawPayload: {
      prUrl: run.prUrl,
      branchName: run.branchName,
      closedPullRequest: result.closedPullRequest,
      deletedBranch: result.deletedBranch,
      pullRequestState: result.pullRequest.state,
      branchExists: result.pullRequest.branch.exists,
    },
  });
  logInfo("github.pr_cleanup.completed", {
    userId,
    runId: run.id,
    prUrl: run.prUrl,
    branchName: run.branchName ?? null,
    closedPullRequest: result.closedPullRequest,
    deletedBranch: result.deletedBranch,
  });

  return result;
}
