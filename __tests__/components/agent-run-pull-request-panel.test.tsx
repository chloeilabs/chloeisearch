import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AgentRunPullRequestPanel } from "@/components/agent-runs/agent-run-pull-request-panel";
import type { PullRequestLifecycle } from "@/lib/github/pull-requests";

describe("AgentRunPullRequestPanel", () => {
  it("keeps a stored pull request URL visible when lifecycle details are absent", () => {
    render(
      <AgentRunPullRequestPanel
        runId="run-1"
        prUrl="https://github.com/acme/web/pull/42"
        initialPullRequest={null}
      />
    );

    expect(screen.queryByText("No pull request linked")).not.toBeInTheDocument();
    expect(screen.getByText("Pull request linked")).toBeInTheDocument();
    expect(screen.getByLabelText("Open pull request")).toHaveAttribute(
      "href",
      "https://github.com/acme/web/pull/42"
    );
  });

  it("shows prompt validation warnings in the pull request panel", () => {
    render(
      <AgentRunPullRequestPanel
        runId="run-1"
        prUrl="https://github.com/acme/web/pull/42"
        initialPullRequest={createPullRequestLifecycle({
          validation: {
            status: "warning",
            summary: "1 validation warning found.",
            warnings: [
              {
                code: "exact_content_mismatch",
                path: "docs/test.md",
                message: "docs/test.md does not exactly match the prompt.",
                expectedPreview: "Expected.",
                actualPreview: "Expected",
              },
            ],
            expected: {
              exactFiles: [{ path: "docs/test.md", exactContent: "Expected." }],
              onlyExpectedFiles: true,
            },
            observed: {
              files: [
                {
                  path: "docs/test.md",
                  status: "added",
                  additions: 1,
                  deletions: 0,
                  changes: 1,
                },
              ],
            },
            fingerprint: "validation-warning",
          },
        })}
      />
    );

    expect(screen.getByText("Validation needs review")).toBeInTheDocument();
    expect(
      screen.getByText("docs/test.md does not exactly match the prompt.")
    ).toBeInTheDocument();
    expect(screen.getByText("Needs review")).toBeInTheDocument();
  });
});

function createPullRequestLifecycle(
  overrides: Partial<PullRequestLifecycle> = {}
): PullRequestLifecycle {
  return {
    repository: "acme/web",
    number: 42,
    url: "https://github.com/acme/web/pull/42",
    title: "Test PR",
    state: "open",
    isDraft: false,
    merged: false,
    mergeable: true,
    mergeState: "clean",
    authorLogin: "cursor",
    baseRef: "main",
    headRef: "cursor/test",
    headSha: "abc123",
    additions: 1,
    deletions: 0,
    changedFiles: 1,
    createdAt: "2026-05-23T14:00:00Z",
    updatedAt: "2026-05-23T14:00:00Z",
    closedAt: null,
    mergedAt: null,
    checks: {
      total: 1,
      passed: 1,
      pending: 0,
      failed: 0,
      neutral: 0,
      items: [],
    },
    reviews: {
      total: 0,
      approvals: 0,
      changesRequested: 0,
      comments: 0,
      items: [],
    },
    reviewComments: { total: 0, items: [] },
    branchProtection: {
      available: true,
      requiredConversationResolution: false,
      requiredStatusChecks: ["quality"],
      requiredApprovingReviewCount: 0,
    },
    branch: {
      name: "cursor/test",
      exists: true,
      canDelete: true,
    },
    files: [
      {
        path: "docs/test.md",
        status: "added",
        additions: 1,
        deletions: 0,
        changes: 1,
      },
    ],
    validation: {
      status: "passed",
      summary: "Validated 1 exact file rule.",
      warnings: [],
      expected: {
        exactFiles: [{ path: "docs/test.md", exactContent: "Expected." }],
        onlyExpectedFiles: true,
      },
      observed: {
        files: [
          {
            path: "docs/test.md",
            status: "added",
            additions: 1,
            deletions: 0,
            changes: 1,
          },
        ],
      },
      fingerprint: "validation-passed",
    },
    blockers: [],
    ...overrides,
  };
}
