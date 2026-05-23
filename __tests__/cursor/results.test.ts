import { describe, expect, it } from "vitest";

import {
  artifactToRecord,
  extractGitResultMetadata,
  extractRunResult,
} from "@/lib/cursor/results";

describe("Cursor result extraction", () => {
  it("extracts branch and pull request metadata", () => {
    expect(
      extractGitResultMetadata({
        git: {
          branches: [
            {
              repoUrl: "https://github.com/acme/web",
              branch: "cursor/fix",
              prUrl: "https://github.com/acme/web/pull/1",
            },
          ],
        },
      })
    ).toEqual({
      branchName: "cursor/fix",
      prUrl: "https://github.com/acme/web/pull/1",
    });
  });

  it("keeps raw result payload and summarizes text", () => {
    const result = extractRunResult({
      id: "run-1",
      status: "finished",
      result: "Done",
      git: { branches: [] },
    });

    expect(result.rawCursorStatus).toBe("finished");
    expect(result.resultSummary).toBe("Done");
    expect(result.resultRawPayload).toMatchObject({ id: "run-1" });
  });

  it("maps SDK artifacts into persisted records", () => {
    expect(
      artifactToRecord({
        path: "reports/summary.txt",
        sizeBytes: 42,
        updatedAt: "2026-05-22T00:00:00.000Z",
      })
    ).toMatchObject({
      artifactId: "reports/summary.txt",
      name: "summary.txt",
      size: 42,
    });
  });
});
