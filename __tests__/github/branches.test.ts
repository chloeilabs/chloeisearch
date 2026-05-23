import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { mapGitHubBranch } from "@/lib/github/branches";

describe("mapGitHubBranch", () => {
  it("maps GitHub branch payloads into safe branch records", () => {
    expect(
      mapGitHubBranch({
        name: "feature/test",
        commit: { sha: "abc1234567890" },
        protected: true,
      })
    ).toEqual({
      name: "feature/test",
      commitSha: "abc1234567890",
      protected: true,
    });
  });
});
