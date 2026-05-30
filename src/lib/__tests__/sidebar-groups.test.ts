import { describe, expect, it } from "vitest";

import { groupRunsByRepository } from "@/lib/agent-runs/sidebar-groups";

describe("groupRunsByRepository", () => {
  it("groups runs by repository host/path", () => {
    const runs = [
      {
        id: "1",
        repoUrl: "https://github.com/acme/a",
        taskSummary: "A",
      },
      {
        id: "2",
        repoUrl: "https://github.com/acme/b",
        taskSummary: "B",
      },
      {
        id: "3",
        repoUrl: "https://github.com/acme/a",
        taskSummary: "C",
      },
    ] as Parameters<typeof groupRunsByRepository>[0];

    const groups = groupRunsByRepository(runs);

    expect(groups).toHaveLength(2);
    expect(
      groups.find((g) => g.label === "github.com/acme/a")?.runs
    ).toHaveLength(2);
  });
});
