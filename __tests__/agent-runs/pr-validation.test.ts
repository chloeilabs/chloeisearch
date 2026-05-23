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

  it("passes extensionless exact-file rules", () => {
    const validation = validatePullRequestAgainstPrompt({
      prompt:
        "Create Dockerfile containing exactly: FROM node:24-alpine Do not change any other files.",
      changedFiles: [
        {
          path: "Dockerfile",
          status: "added",
          additions: 1,
          deletions: 0,
          changes: 1,
        },
      ],
      fileContents: {
        Dockerfile: "FROM node:24-alpine\n",
      },
    });

    expect(validation.status).toBe("passed");
    expect(validation.warnings).toEqual([]);
  });

  it("passes dotfile exact-file rules", () => {
    const validation = validatePullRequestAgainstPrompt({
      prompt:
        "Create .env containing exactly: FEATURE_FLAG=true Do not change any other files.",
      changedFiles: [
        {
          path: ".env",
          status: "added",
          additions: 1,
          deletions: 0,
          changes: 1,
        },
      ],
      fileContents: {
        ".env": "FEATURE_FLAG=true\n",
      },
    });

    expect(validation.status).toBe("passed");
    expect(validation.warnings).toEqual([]);
  });

  it("does not expose exact content through the validation fingerprint", () => {
    const validation = validatePullRequestAgainstPrompt({
      prompt: "Create docs/test.md containing exactly: sensitive-value",
      changedFiles: [
        {
          path: "docs/test.md",
          status: "added",
          additions: 1,
          deletions: 0,
          changes: 1,
        },
      ],
      fileContents: {
        "docs/test.md": "different-value\n",
      },
    });

    expect(validation.fingerprint).not.toContain("sensitive-value");
    expect(validation.fingerprint).not.toContain("different-value");
  });
});
