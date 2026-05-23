import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AgentRunPullRequestPanel } from "@/components/agent-runs/agent-run-pull-request-panel";

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
});
