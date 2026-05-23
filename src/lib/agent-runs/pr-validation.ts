export type PullRequestValidationStatus =
  | "passed"
  | "warning"
  | "not_applicable"
  | "unavailable";

export type PullRequestChangedFile = {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
};

export type PullRequestValidationExpectedFile = {
  path: string;
  exactContent: string;
};

export type PullRequestValidationWarning = {
  code:
    | "unexpected_files"
    | "missing_file"
    | "content_unavailable"
    | "exact_content_mismatch";
  message: string;
  path?: string;
  expectedPreview?: string;
  actualPreview?: string;
};

export type PullRequestValidationExpectation = {
  exactFiles: PullRequestValidationExpectedFile[];
  onlyExpectedFiles: boolean;
};

export type PullRequestValidation = {
  status: PullRequestValidationStatus;
  summary: string;
  warnings: PullRequestValidationWarning[];
  expected: PullRequestValidationExpectation;
  observed: {
    files: PullRequestChangedFile[];
  };
  fingerprint: string;
};

const exactFilePattern =
  /(?:create|add|write|update)\s+[`"']?([A-Za-z0-9._/-]+\.[A-Za-z0-9][A-Za-z0-9._-]*)[`"']?\s+(?:containing|with)\s+exactly:\s*([\s\S]+?)(?=\s+(?:Do not change any other files|Only change(?: this| these| the specified)? files?|Open (?:a )?pull request|Create (?:a )?pull request)\b|$)/gi;

export function extractPromptValidationExpectation(
  prompt: string
): PullRequestValidationExpectation {
  const exactFiles: PullRequestValidationExpectedFile[] = [];

  for (const match of prompt.matchAll(exactFilePattern)) {
    const [, path, content] = match;

    if (!path || !content) {
      continue;
    }

    exactFiles.push({
      path: normalizePromptPath(path),
      exactContent: unwrapPromptContent(content),
    });
  }

  return {
    exactFiles: dedupeExpectedFiles(exactFiles),
    onlyExpectedFiles:
      /\bdo not change any other files\b/i.test(prompt) ||
      /\bonly change(?: this| these| the specified)? files?\b/i.test(prompt),
  };
}

export function validatePullRequestAgainstPrompt(input: {
  prompt: string;
  changedFiles: PullRequestChangedFile[];
  fileContents: Record<string, string | null | undefined>;
}): PullRequestValidation {
  const expected = extractPromptValidationExpectation(input.prompt);
  const warnings: PullRequestValidationWarning[] = [];
  const changedFilePaths = new Set(input.changedFiles.map((file) => file.path));
  const expectedFilePaths = new Set(expected.exactFiles.map((file) => file.path));

  if (expected.onlyExpectedFiles && expected.exactFiles.length > 0) {
    const unexpectedFiles = input.changedFiles.filter(
      (file) => !expectedFilePaths.has(file.path)
    );

    if (unexpectedFiles.length > 0) {
      warnings.push({
        code: "unexpected_files",
        message: `Prompt requested no other files, but ${unexpectedFiles.length} unexpected file changed.`,
        actualPreview: unexpectedFiles.map((file) => file.path).join(", "),
      });
    }
  }

  for (const expectedFile of expected.exactFiles) {
    if (!changedFilePaths.has(expectedFile.path)) {
      warnings.push({
        code: "missing_file",
        path: expectedFile.path,
        message: `Expected file ${expectedFile.path} was not changed in the pull request.`,
      });
      continue;
    }

    const actualContent = input.fileContents[expectedFile.path];

    if (actualContent === null || actualContent === undefined) {
      warnings.push({
        code: "content_unavailable",
        path: expectedFile.path,
        message: `Could not load ${expectedFile.path} at the pull request head commit.`,
      });
      continue;
    }

    if (
      normalizeComparableContent(actualContent) !==
      normalizeComparableContent(expectedFile.exactContent)
    ) {
      warnings.push({
        code: "exact_content_mismatch",
        path: expectedFile.path,
        message: `${expectedFile.path} does not exactly match the prompt.`,
        expectedPreview: previewText(expectedFile.exactContent),
        actualPreview: previewText(actualContent),
      });
    }
  }

  const status = getValidationStatus(expected, warnings);
  const validation = {
    status,
    summary: getValidationSummary(status, expected, warnings),
    warnings,
    expected,
    observed: {
      files: input.changedFiles,
    },
    fingerprint: "",
  };

  validation.fingerprint = createValidationFingerprint(validation);

  return validation;
}

function getValidationStatus(
  expected: PullRequestValidationExpectation,
  warnings: PullRequestValidationWarning[]
): PullRequestValidationStatus {
  if (expected.exactFiles.length === 0) {
    return "not_applicable";
  }

  if (warnings.some((warning) => warning.code === "content_unavailable")) {
    return warnings.length === 1 ? "unavailable" : "warning";
  }

  return warnings.length > 0 ? "warning" : "passed";
}

function getValidationSummary(
  status: PullRequestValidationStatus,
  expected: PullRequestValidationExpectation,
  warnings: PullRequestValidationWarning[]
) {
  switch (status) {
    case "passed":
      return `Validated ${expected.exactFiles.length} exact file rule${
        expected.exactFiles.length === 1 ? "" : "s"
      }.`;
    case "warning":
      return `${warnings.length} validation warning${
        warnings.length === 1 ? "" : "s"
      } found.`;
    case "unavailable":
      return "Validation could not load all required PR file content.";
    default:
      return "No exact prompt validation rules were detected.";
  }
}

function createValidationFingerprint(
  validation: Omit<PullRequestValidation, "fingerprint">
) {
  return JSON.stringify({
    status: validation.status,
    expected: validation.expected,
    warnings: validation.warnings.map((warning) => ({
      code: warning.code,
      path: warning.path,
      message: warning.message,
      expectedPreview: warning.expectedPreview,
      actualPreview: warning.actualPreview,
    })),
    files: validation.observed.files.map((file) => ({
      path: file.path,
      additions: file.additions,
      deletions: file.deletions,
      status: file.status,
    })),
  });
}

function dedupeExpectedFiles(files: PullRequestValidationExpectedFile[]) {
  const deduped = new Map<string, PullRequestValidationExpectedFile>();

  for (const file of files) {
    deduped.set(file.path, file);
  }

  return [...deduped.values()];
}

function normalizePromptPath(path: string) {
  return path.trim().replace(/^\.?\//, "");
}

function unwrapPromptContent(content: string) {
  let normalized = content.trim();
  const fenced = normalized.match(/^```[A-Za-z0-9_-]*\s*([\s\S]*?)\s*```$/);

  if (fenced?.[1] !== undefined) {
    normalized = fenced[1];
  }

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'")) ||
    (normalized.startsWith("`") && normalized.endsWith("`"))
  ) {
    normalized = normalized.slice(1, -1);
  }

  return normalized.trim();
}

function normalizeComparableContent(content: string) {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n$/, "");
}

function previewText(content: string) {
  const compact = normalizeComparableContent(content).replace(/\s+/g, " ").trim();

  return compact.length > 140 ? `${compact.slice(0, 137)}...` : compact;
}
