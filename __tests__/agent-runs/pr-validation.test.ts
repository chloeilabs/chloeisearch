import { describe, expect, it } from "vitest";

import {
  extractPromptValidationExpectation,
  validatePullRequestAgainstPrompt,
} from "@/lib/agent-runs/pr-validation";

describe("extractPromptValidationExpectation", () => {
  it("extracts exact file content and only-file constraints", () => {
    const expectation = extractPromptValidationExpectation(
      "Create docs/acceptance-test-2026-05-23.md containing exactly: Chloei Code acceptance test - 2026-05-23. Do not change any other files. Open a pull request."
    );

    expect(expectation).toEqual({
      exactFiles: [
        {
          path: "docs/acceptance-test-2026-05-23.md",
          exactContent: "Chloei Code acceptance test - 2026-05-23.",
        },
      ],
      onlyExpectedFiles: true,
    });
  });
});

describe("validatePullRequestAgainstPrompt", () => {
  const prompt =
    "Create docs/acceptance-test-2026-05-23.md containing exactly: Chloei Code acceptance test - 2026-05-23. Do not change any other files. Open a pull request.";

  it("passes when exact prompt rules match the pull request", () => {
    const validation = validatePullRequestAgainstPrompt({
      prompt,
      changedFiles: [
        {
          path: "docs/acceptance-test-2026-05-23.md",
          status: "added",
          additions: 1,
          deletions: 0,
          changes: 1,
        },
      ],
      fileContents: {
        "docs/acceptance-test-2026-05-23.md":
          "Chloei Code acceptance test - 2026-05-23.\n",
      },
    });

    expect(validation.status).toBe("passed");
    expect(validation.warnings).toEqual([]);
  });

  it("warns when exact generated content misses prompt punctuation", () => {
    const validation = validatePullRequestAgainstPrompt({
      prompt,
      changedFiles: [
        {
          path: "docs/acceptance-test-2026-05-23.md",
          status: "added",
          additions: 1,
          deletions: 0,
          changes: 1,
        },
      ],
      fileContents: {
        "docs/acceptance-test-2026-05-23.md":
          "Chloei Code acceptance test - 2026-05-23\n",
      },
    });

    expect(validation.status).toBe("warning");
    expect(validation.warnings).toMatchObject([
      {
        code: "exact_content_mismatch",
        path: "docs/acceptance-test-2026-05-23.md",
      },
    ]);
  });

  it("warns when another file changed despite the prompt constraint", () => {
    const validation = validatePullRequestAgainstPrompt({
      prompt,
      changedFiles: [
        {
          path: "docs/acceptance-test-2026-05-23.md",
          status: "added",
          additions: 1,
          deletions: 0,
          changes: 1,
        },
        {
          path: "README.md",
          status: "modified",
          additions: 1,
          deletions: 0,
          changes: 1,
        },
      ],
      fileContents: {
        "docs/acceptance-test-2026-05-23.md":
          "Chloei Code acceptance test - 2026-05-23.\n",
      },
    });

    expect(validation.status).toBe("warning");
    expect(validation.warnings.map((warning) => warning.code)).toContain(
      "unexpected_files"
    );
  });

  it("skips validation when no exact file rule can be derived", () => {
    const validation = validatePullRequestAgainstPrompt({
      prompt: "Only change the documentation and open a pull request.",
      changedFiles: [
        {
          path: "README.md",
          status: "modified",
          additions: 1,
          deletions: 0,
          changes: 1,
        },
      ],
      fileContents: {},
    });

    expect(validation.status).toBe("not_applicable");
  });
});
