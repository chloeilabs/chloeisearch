import "server-only";

import { ApiError } from "@/lib/api";
import {
  fetchGitHubJson,
  fetchOptionalGitHubJson,
  getGitHubAccessToken,
} from "@/lib/github/client";
import { parseGitHubRepositoryUrl } from "@/lib/github/branches";

const maxPrItems = 100;

export type RunPullRequestTarget = {
  repoUrl: string;
  prUrl?: string | null;
  branchName?: string | null;
  startingRef: string;
};

export type ParsedGitHubPullRequestUrl = {
  owner: string;
  repo: string;
  number: number;
  repositoryFullName: string;
};

export type PullRequestCheckState =
  | "passed"
  | "pending"
  | "failed"
  | "neutral";

export type PullRequestLifecycle = {
  repository: string;
  number: number;
  url: string;
  title: string;
  state: string;
  isDraft: boolean;
  merged: boolean;
  mergeable: boolean | null;
  mergeState: string | null;
  authorLogin?: string;
  baseRef: string;
  headRef: string;
  headSha: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  mergedAt?: string | null;
  checks: PullRequestChecksSummary;
  reviews: PullRequestReviewsSummary;
  reviewComments: PullRequestReviewCommentsSummary;
  branchProtection: PullRequestBranchProtectionSummary;
  branch: PullRequestBranchSummary;
  blockers: string[];
};

export type PullRequestCleanupResult = {
  pullRequest: PullRequestLifecycle;
  closedPullRequest: boolean;
  deletedBranch: boolean;
};

export type PullRequestChecksSummary = {
  total: number;
  passed: number;
  pending: number;
  failed: number;
  neutral: number;
  items: PullRequestCheckItem[];
};

export type PullRequestCheckItem = {
  name: string;
  state: PullRequestCheckState;
  status: string;
  conclusion?: string | null;
  url?: string | null;
  completedAt?: string | null;
};

export type PullRequestReviewsSummary = {
  total: number;
  approvals: number;
  changesRequested: number;
  comments: number;
  items: PullRequestReviewItem[];
};

export type PullRequestReviewItem = {
  id: number;
  authorLogin?: string;
  state: string;
  body?: string | null;
  submittedAt?: string | null;
  url?: string | null;
};

export type PullRequestReviewCommentsSummary = {
  total: number;
  items: PullRequestReviewCommentItem[];
};

export type PullRequestReviewCommentItem = {
  id: number;
  authorLogin?: string;
  path: string;
  line?: number | null;
  body: string;
  url: string;
  createdAt: string;
};

export type PullRequestBranchProtectionSummary = {
  available: boolean;
  requiredConversationResolution: boolean;
  requiredStatusChecks: string[];
  requiredApprovingReviewCount: number;
};

export type PullRequestBranchSummary = {
  name: string;
  exists: boolean;
  canDelete: boolean;
  deleteBlockedReason?: string;
};

type PullRequestBlockerInput = Pick<
  PullRequestLifecycle,
  | "state"
  | "isDraft"
  | "checks"
  | "reviews"
  | "reviewComments"
  | "branchProtection"
  | "mergeState"
>;

type BranchDeletionPullRequest = {
  head: {
    ref: string;
    repo?: {
      full_name: string;
      default_branch: string;
    } | null;
  };
  base: {
    ref: string;
    repo: {
      full_name: string;
      default_branch: string;
    };
  };
};

type GitHubApiPullRequest = {
  number: number;
  title: string;
  state: string;
  draft: boolean;
  html_url: string;
  merged: boolean;
  mergeable: boolean | null;
  mergeable_state: string | null;
  additions: number;
  deletions: number;
  changed_files: number;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  merged_at?: string | null;
  user?: { login: string } | null;
  head: {
    ref: string;
    sha: string;
    repo?: {
      full_name: string;
      default_branch: string;
    } | null;
  };
  base: {
    ref: string;
    repo: {
      full_name: string;
      default_branch: string;
    };
  };
};

type GitHubApiCheckRunsResponse = {
  check_runs: GitHubApiCheckRun[];
};

type GitHubApiCheckRun = {
  name: string;
  status: string;
  conclusion?: string | null;
  html_url?: string | null;
  details_url?: string | null;
  completed_at?: string | null;
};

type GitHubApiCombinedStatus = {
  statuses: GitHubApiStatus[];
};

type GitHubApiStatus = {
  context: string;
  state: string;
  target_url?: string | null;
  updated_at?: string | null;
};

type GitHubApiReview = {
  id: number;
  state: string;
  body?: string | null;
  html_url?: string | null;
  submitted_at?: string | null;
  user?: { login: string } | null;
};

type GitHubApiReviewComment = {
  id: number;
  path: string;
  line?: number | null;
  body: string;
  html_url: string;
  created_at: string;
  user?: { login: string } | null;
};

type GitHubApiBranchProtection = {
  required_conversation_resolution?: {
    enabled: boolean;
  };
  required_status_checks?: {
    contexts?: string[];
    checks?: Array<{ context: string }>;
  } | null;
  required_pull_request_reviews?: {
    required_approving_review_count?: number;
  } | null;
};

type GitHubApiRef = {
  ref: string;
};

export function parseGitHubPullRequestUrl(
  pullRequestUrl: string
): ParsedGitHubPullRequestUrl {
  const url = new URL(pullRequestUrl);
  const [owner, repo, resource, number] = url.pathname
    .replace(/^\/|\/$/g, "")
    .split("/");

  if (
    url.hostname !== "github.com" ||
    !owner ||
    !repo ||
    resource !== "pull" ||
    !number
  ) {
    throw new ApiError(400, "Stored pull request URL is not a valid GitHub PR.");
  }

  const parsedNumber = Number(number);

  if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
    throw new ApiError(400, "Stored pull request URL has an invalid PR number.");
  }

  return {
    owner,
    repo,
    number: parsedNumber,
    repositoryFullName: `${owner}/${repo}`,
  };
}

export function assertRunPullRequestTarget(run: RunPullRequestTarget) {
  if (!run.prUrl) {
    throw new ApiError(409, "This run does not have a pull request URL.");
  }

  const repository = parseGitHubRepositoryUrl(run.repoUrl);
  const pullRequest = parseGitHubPullRequestUrl(run.prUrl);

  if (
    repository.owner.toLowerCase() !== pullRequest.owner.toLowerCase() ||
    repository.repo.toLowerCase() !== pullRequest.repo.toLowerCase()
  ) {
    throw new ApiError(
      409,
      "Stored pull request URL does not match this run repository."
    );
  }

  return pullRequest;
}

export async function getGitHubPullRequestLifecycle(
  userId: string,
  run: RunPullRequestTarget
): Promise<PullRequestLifecycle> {
  const token = await getGitHubAccessToken(userId);
  const target = assertRunPullRequestTarget(run);
  const repoPath = repoApiPath(target);
  const pullPath = `${repoPath}/pulls/${target.number}`;
  const pullRequest = await fetchGitHubJson<GitHubApiPullRequest>(
    token,
    pullPath,
    "Unable to load pull request from GitHub."
  );
  const headSha = pullRequest.head.sha;
  const baseRef = pullRequest.base.ref;

  const [
    checkRuns,
    combinedStatus,
    reviews,
    reviewComments,
    branchProtection,
    branchRef,
  ] = await Promise.all([
    fetchGitHubJson<GitHubApiCheckRunsResponse>(
      token,
      `${repoPath}/commits/${encodeURIComponent(headSha)}/check-runs?per_page=${maxPrItems}`,
      "Unable to load GitHub check runs."
    ),
    fetchGitHubJson<GitHubApiCombinedStatus>(
      token,
      `${repoPath}/commits/${encodeURIComponent(headSha)}/status`,
      "Unable to load GitHub commit statuses."
    ),
    fetchGitHubJson<GitHubApiReview[]>(
      token,
      `${pullPath}/reviews?per_page=${maxPrItems}`,
      "Unable to load pull request reviews."
    ),
    fetchGitHubJson<GitHubApiReviewComment[]>(
      token,
      `${pullPath}/comments?per_page=${maxPrItems}`,
      "Unable to load pull request review comments."
    ),
    fetchOptionalGitHubJson<GitHubApiBranchProtection>(
      token,
      `${repoPath}/branches/${encodeURIComponent(baseRef)}/protection`,
      "Unable to load branch protection."
    ),
    fetchOptionalGitHubJson<GitHubApiRef>(
      token,
      `${repoPath}/git/ref/${encodeGitRef(`heads/${pullRequest.head.ref}`)}`,
      "Unable to load pull request branch."
    ),
  ]);

  return mapPullRequestLifecycle(run, pullRequest, {
    checkRuns: checkRuns.check_runs,
    statuses: combinedStatus.statuses,
    reviews,
    reviewComments,
    branchProtection,
    branchExists: Boolean(branchRef),
  });
}

export async function cleanupGitHubPullRequest(
  userId: string,
  run: RunPullRequestTarget
): Promise<PullRequestCleanupResult> {
  const token = await getGitHubAccessToken(userId);
  const target = assertRunPullRequestTarget(run);
  const repoPath = repoApiPath(target);
  let pullRequest = await fetchGitHubJson<GitHubApiPullRequest>(
    token,
    `${repoPath}/pulls/${target.number}`,
    "Unable to load pull request from GitHub."
  );

  let closedPullRequest = false;

  if (pullRequest.state === "open") {
    pullRequest = await fetchGitHubJson<GitHubApiPullRequest>(
      token,
      `${repoPath}/pulls/${target.number}`,
      "Unable to close pull request.",
      { method: "PATCH", body: { state: "closed" } }
    );
    closedPullRequest = true;
  }

  const branchSummary = summarizeBranch(run, pullRequest, true);
  let deletedBranch = false;

  if (branchSummary.canDelete) {
    await fetchGitHubJson<void>(
      token,
      `${repoPath}/git/refs/${encodeGitRef(`heads/${pullRequest.head.ref}`)}`,
      "Unable to delete pull request branch.",
      { method: "DELETE" }
    );
    deletedBranch = true;
  }

  return {
    pullRequest: await getGitHubPullRequestLifecycle(userId, run),
    closedPullRequest,
    deletedBranch,
  };
}

export function mapPullRequestLifecycle(
  run: RunPullRequestTarget,
  pullRequest: GitHubApiPullRequest,
  detail: {
    checkRuns: GitHubApiCheckRun[];
    statuses: GitHubApiStatus[];
    reviews: GitHubApiReview[];
    reviewComments: GitHubApiReviewComment[];
    branchProtection: GitHubApiBranchProtection | null;
    branchExists: boolean;
  }
): PullRequestLifecycle {
  const checks = summarizeChecks(detail.checkRuns, detail.statuses);
  const reviews = summarizeReviews(detail.reviews);
  const reviewComments = summarizeReviewComments(detail.reviewComments);
  const branchProtection = summarizeBranchProtection(detail.branchProtection);
  const branch = summarizeBranch(run, pullRequest, detail.branchExists);
  const lifecycle = {
    repository: pullRequest.base.repo.full_name,
    number: pullRequest.number,
    url: pullRequest.html_url,
    title: pullRequest.title,
    state: pullRequest.state,
    isDraft: pullRequest.draft,
    merged: pullRequest.merged,
    mergeable: pullRequest.mergeable,
    mergeState: pullRequest.mergeable_state,
    authorLogin: pullRequest.user?.login,
    baseRef: pullRequest.base.ref,
    headRef: pullRequest.head.ref,
    headSha: pullRequest.head.sha,
    additions: pullRequest.additions,
    deletions: pullRequest.deletions,
    changedFiles: pullRequest.changed_files,
    createdAt: pullRequest.created_at,
    updatedAt: pullRequest.updated_at,
    closedAt: pullRequest.closed_at,
    mergedAt: pullRequest.merged_at,
    checks,
    reviews,
    reviewComments,
    branchProtection,
    branch,
    blockers: [] as string[],
  };

  lifecycle.blockers = buildPullRequestBlockers(lifecycle);

  return lifecycle;
}

export function summarizeChecks(
  checkRuns: GitHubApiCheckRun[],
  statuses: GitHubApiStatus[]
): PullRequestChecksSummary {
  const items = [
    ...checkRuns.map((checkRun) => ({
      name: checkRun.name,
      state: classifyCheckRun(checkRun),
      status: checkRun.status,
      conclusion: checkRun.conclusion,
      url: checkRun.html_url ?? checkRun.details_url,
      completedAt: checkRun.completed_at,
    })),
    ...statuses.map((status) => ({
      name: status.context,
      state: classifyStatus(status.state),
      status: status.state,
      conclusion: status.state,
      url: status.target_url,
      completedAt: status.updated_at,
    })),
  ];

  return {
    total: items.length,
    passed: items.filter((item) => item.state === "passed").length,
    pending: items.filter((item) => item.state === "pending").length,
    failed: items.filter((item) => item.state === "failed").length,
    neutral: items.filter((item) => item.state === "neutral").length,
    items,
  };
}

export function buildPullRequestBlockers(
  lifecycle: PullRequestBlockerInput
) {
  const blockers: string[] = [];

  if (lifecycle.state !== "open") {
    return blockers;
  }

  if (lifecycle.isDraft) {
    blockers.push("Pull request is still a draft.");
  }

  if (lifecycle.checks.failed > 0) {
    blockers.push("One or more checks are failing.");
  }

  if (lifecycle.checks.pending > 0) {
    blockers.push("One or more checks are still running.");
  }

  if (lifecycle.reviews.changesRequested > 0) {
    blockers.push("A reviewer requested changes.");
  }

  if (
    lifecycle.branchProtection.requiredConversationResolution &&
    lifecycle.reviewComments.total > 0
  ) {
    blockers.push("Review conversations may need resolution before merge.");
  }

  if (
    lifecycle.mergeState &&
    !["clean", "unstable", "has_hooks"].includes(lifecycle.mergeState) &&
    blockers.length === 0
  ) {
    blockers.push(`GitHub merge state is ${lifecycle.mergeState}.`);
  }

  return blockers;
}

function summarizeReviews(reviews: GitHubApiReview[]): PullRequestReviewsSummary {
  const items = reviews.map((review) => ({
    id: review.id,
    authorLogin: review.user?.login,
    state: review.state,
    body: review.body,
    submittedAt: review.submitted_at,
    url: review.html_url,
  }));

  return {
    total: items.length,
    approvals: items.filter((item) => item.state === "APPROVED").length,
    changesRequested: items.filter((item) => item.state === "CHANGES_REQUESTED")
      .length,
    comments: items.filter((item) => item.state === "COMMENTED").length,
    items,
  };
}

function summarizeReviewComments(
  comments: GitHubApiReviewComment[]
): PullRequestReviewCommentsSummary {
  return {
    total: comments.length,
    items: comments.map((comment) => ({
      id: comment.id,
      authorLogin: comment.user?.login,
      path: comment.path,
      line: comment.line,
      body: comment.body,
      url: comment.html_url,
      createdAt: comment.created_at,
    })),
  };
}

function summarizeBranchProtection(
  protection: GitHubApiBranchProtection | null
): PullRequestBranchProtectionSummary {
  const statusChecks = protection?.required_status_checks;
  const contexts = new Set<string>([
    ...(statusChecks?.contexts ?? []),
    ...(statusChecks?.checks?.map((check) => check.context) ?? []),
  ]);

  return {
    available: Boolean(protection),
    requiredConversationResolution: Boolean(
      protection?.required_conversation_resolution?.enabled
    ),
    requiredStatusChecks: [...contexts].sort(),
    requiredApprovingReviewCount:
      protection?.required_pull_request_reviews?.required_approving_review_count ??
      0,
  };
}

function summarizeBranch(
  run: RunPullRequestTarget,
  pullRequest: GitHubApiPullRequest,
  branchExists: boolean
): PullRequestBranchSummary {
  const deleteBlockedReason = getBranchDeleteBlockedReason(
    run,
    pullRequest,
    branchExists
  );

  return {
    name: pullRequest.head.ref,
    exists: branchExists,
    canDelete: !deleteBlockedReason,
    deleteBlockedReason,
  };
}

export function getBranchDeleteBlockedReason(
  run: RunPullRequestTarget,
  pullRequest: BranchDeletionPullRequest,
  branchExists: boolean
) {
  if (!branchExists) {
    return "Branch is already deleted.";
  }

  if (!run.branchName) {
    return "Run did not store a Cursor-created branch name.";
  }

  if (run.branchName !== pullRequest.head.ref) {
    return "PR head branch does not match the stored run branch.";
  }

  if (!pullRequest.head.repo) {
    return "PR head repository is not available.";
  }

  if (
    pullRequest.head.repo.full_name.toLowerCase() !==
    pullRequest.base.repo.full_name.toLowerCase()
  ) {
    return "Head branch is in a fork and will not be deleted by this app.";
  }

  if (pullRequest.head.ref === pullRequest.base.ref) {
    return "Head branch matches the base branch.";
  }

  if (pullRequest.head.ref === pullRequest.head.repo.default_branch) {
    return "Head branch is the repository default branch.";
  }

  if (pullRequest.head.ref === run.startingRef) {
    return "Head branch matches the run starting ref.";
  }

  return undefined;
}

function classifyCheckRun(checkRun: GitHubApiCheckRun): PullRequestCheckState {
  if (checkRun.status !== "completed") {
    return "pending";
  }

  switch (checkRun.conclusion) {
    case "success":
      return "passed";
    case "neutral":
    case "skipped":
      return "neutral";
    default:
      return "failed";
  }
}

function classifyStatus(state: string): PullRequestCheckState {
  switch (state) {
    case "success":
      return "passed";
    case "pending":
      return "pending";
    default:
      return "failed";
  }
}

function repoApiPath(target: ParsedGitHubPullRequestUrl) {
  return `/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(
    target.repo
  )}`;
}

function encodeGitRef(ref: string) {
  return ref.split("/").map(encodeURIComponent).join("/");
}
