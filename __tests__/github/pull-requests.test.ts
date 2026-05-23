import { describe, expect, it, vi } from "vitest";

import {
  buildPullRequestBlockers,
  getBranchDeleteBlockedReason,
  parseGitHubPullRequestUrl,
  summarizeChecks,
} from "@/lib/github/pull-requests";

vi.mock("server-only", () => ({}));

describe("parseGitHubPullRequestUrl", () => {
  it("extracts repository and pull request number", () => {
    expect(
      parseGitHubPullRequestUrl("https://github.com/acme/web/pull/42")
    ).toEqual({
      owner: "acme",
      repo: "web",
      number: 42,
      repositoryFullName: "acme/web",
    });
  });

  it("rejects non-PR URLs", () => {
    expect(() =>
      parseGitHubPullRequestUrl("https://github.com/acme/web/issues/42")
    ).toThrow();
  });
});

describe("summarizeChecks", () => {
  it("summarizes check runs and status contexts", () => {
    const summary = summarizeChecks(
      [
        { name: "checks", status: "completed", conclusion: "success" },
        { name: "review", status: "completed", conclusion: "neutral" },
        { name: "deploy", status: "in_progress" },
      ],
      [
        { context: "Vercel", state: "success" },
        { context: "CodeRabbit", state: "failure" },
      ]
    );

    expect(summary.total).toBe(5);
    expect(summary.passed).toBe(2);
    expect(summary.pending).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.neutral).toBe(1);
  });
});

describe("getBranchDeleteBlockedReason", () => {
  const pullRequest = {
    head: {
      ref: "cursor/fix-readme",
      repo: { full_name: "acme/web", default_branch: "main" },
    },
    base: {
      ref: "main",
      repo: { full_name: "acme/web", default_branch: "main" },
    },
  };

  it("allows deletion for the stored same-repository head branch", () => {
    expect(
      getBranchDeleteBlockedReason(
        {
          repoUrl: "https://github.com/acme/web",
          branchName: "cursor/fix-readme",
          startingRef: "main",
        },
        pullRequest,
        true
      )
    ).toBeUndefined();
  });

  it("blocks deletion when the branch does not match the run", () => {
    expect(
      getBranchDeleteBlockedReason(
        {
          repoUrl: "https://github.com/acme/web",
          branchName: "feature/other",
          startingRef: "main",
        },
        pullRequest,
        true
      )
    ).toBe("PR head branch does not match the stored run branch.");
  });
});

describe("buildPullRequestBlockers", () => {
  it("reports pending checks and unresolved review conversations", () => {
    const blockers = buildPullRequestBlockers({
      state: "open",
      isDraft: false,
      checks: {
        total: 1,
        passed: 0,
        pending: 1,
        failed: 0,
        neutral: 0,
        items: [],
      },
      reviews: {
        total: 1,
        approvals: 0,
        changesRequested: 0,
        comments: 1,
        items: [],
      },
      reviewComments: { total: 1, items: [] },
      branchProtection: {
        available: true,
        requiredConversationResolution: true,
        requiredStatusChecks: ["checks"],
        requiredApprovingReviewCount: 0,
      },
      mergeState: "blocked",
    });

    expect(blockers).toEqual([
      "One or more checks are still running.",
      "Review conversations may need resolution before merge.",
    ]);
  });
});
