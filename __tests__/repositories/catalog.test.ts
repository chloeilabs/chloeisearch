import { describe, expect, it } from "vitest";

import { mergeRepositoryCatalogs } from "@/lib/repositories/catalog";

describe("mergeRepositoryCatalogs", () => {
  it("merges GitHub repositories with Cursor-connected repositories", () => {
    expect(
      mergeRepositoryCatalogs(
        [
          {
            id: 1,
            name: "web",
            fullName: "acme/web",
            owner: "acme",
            private: true,
            fork: false,
            archived: false,
            defaultBranch: "main",
            url: "https://github.com/acme/web",
            pushedAt: "2026-05-22T00:00:00Z",
          },
        ],
        [
          { url: "https://github.com/acme/web" },
          { url: "https://github.com/acme/api" },
        ]
      )
    ).toEqual([
      {
        url: "https://github.com/acme/api",
        label: "acme/api",
        githubAvailable: false,
        cursorConnected: true,
      },
      {
        url: "https://github.com/acme/web",
        label: "acme/web",
        owner: "acme",
        defaultBranch: "main",
        private: true,
        fork: false,
        archived: false,
        githubAvailable: true,
        cursorConnected: true,
      },
    ]);
  });
});
