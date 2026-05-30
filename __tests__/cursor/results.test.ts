import { describe, expect, it } from "vitest";

import {
  artifactToRecord,
  extractGitResultMetadata,
  extractRunResult,
  type ExtractableRunPayload,
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
      durationMs: 23000,
      git: { branches: [] },
    } satisfies ExtractableRunPayload);

    expect(result.rawCursorStatus).toBe("finished");
    expect(result.resultSummary).toBe("Done");
    expect(result.resultRawPayload).toMatchObject({
      id: "run-1",
      durationMs: 23000,
    });
  });

  it("does not summarize partial result while run is still active", () => {
    const result = extractRunResult({
      id: "run-1",
      status: "running",
      result: "Partial output so far",
      git: { branches: [] },
    } satisfies ExtractableRunPayload);

    expect(result.resultSummary).toBeUndefined();
    expect(result.rawCursorStatus).toBe("running");
  });

  it("falls back to pull request URLs and Cursor branches in result text", () => {
    const result = extractRunResult({
      id: "run-1",
      status: "finished",
      result:
        "Opened https://github.com/acme/web/pull/42 from branch cursor/smoke-test-aa36.",
      git: { branches: [] },
    });

    expect(result.prUrl).toBe("https://github.com/acme/web/pull/42");
    expect(result.branchName).toBe("cursor/smoke-test-aa36");
  });

  it("falls back to nested Cursor metadata when git branches are absent", () => {
    const resultPayload = {
      id: "run-1",
      status: "finished",
      result: "Done",
      git: { branches: [] },
      details: {
        pullRequest: "https://github.com/acme/web/pull/43",
        headRef: "cursor/fix-nested-pr",
      },
    } as unknown as Parameters<typeof extractRunResult>[0];
    const result = extractRunResult(resultPayload);

    expect(result.prUrl).toBe("https://github.com/acme/web/pull/43");
    expect(result.branchName).toBe("cursor/fix-nested-pr");
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
