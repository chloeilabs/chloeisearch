import { describe, expect, it } from "vitest";

import {
  buildArchivedAtWhere,
  resolveListRunsForUserOptions,
} from "@/lib/agent-runs/list-runs-options";

describe("resolveListRunsForUserOptions", () => {
  it("defaults to active-only listing", () => {
    expect(resolveListRunsForUserOptions()).toEqual({ archived: "active" });
  });

  it("supports legacy status string argument", () => {
    expect(resolveListRunsForUserOptions("running")).toEqual({
      status: "running",
      archived: "active",
    });
  });

  it("merges explicit archived mode", () => {
    expect(
      resolveListRunsForUserOptions({ archived: "archived", status: "finished" })
    ).toEqual({
      status: "finished",
      archived: "archived",
    });
  });
});

describe("buildArchivedAtWhere", () => {
  it("filters active, archived, or all", () => {
    expect(buildArchivedAtWhere("active")).toEqual({ archivedAt: null });
    expect(buildArchivedAtWhere("archived")).toEqual({
      archivedAt: { not: null },
    });
    expect(buildArchivedAtWhere("all")).toEqual({});
    expect(buildArchivedAtWhere(undefined)).toEqual({ archivedAt: null });
  });
});
