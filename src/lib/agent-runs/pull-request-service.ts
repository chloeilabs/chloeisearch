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

export async function getRunPullRequestLifecycle(userId: string, runId: string) {
  const run = await getRunForUser(userId, runId);

  if (!run) {
    throw new ApiError(404, "Run not found.");
  }

  if (!run.prUrl) {
    return null;
  }

  return getGitHubPullRequestLifecycle(userId, run);
}

export async function cleanupRunPullRequest(userId: string, runId: string) {
  const run = await getRunForUser(userId, runId);

  if (!run) {
    throw new ApiError(404, "Run not found.");
  }

  if (!run.prUrl) {
    throw new ApiError(409, "This run does not have a pull request URL.");
  }

  const result = await cleanupGitHubPullRequest(userId, run);
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

  return result;
}
