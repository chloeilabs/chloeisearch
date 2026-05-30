import type { Run, RunResult, RunStatus, RunResultStatus, SDKArtifact } from "@cursor/sdk";

import { isTerminalStatus } from "@/lib/cursor/status";

export type ExtractedGitMetadata = {
  prUrl?: string;
  branchName?: string;
};

export type ExtractedRunResult = ExtractedGitMetadata & {
  resultSummary?: string;
  resultRawPayload?: unknown;
  rawCursorStatus?: string;
};

const githubPullRequestUrlPattern =
  /https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/\d+/i;
const cursorBranchPattern = /\bcursor\/[A-Za-z0-9._/-]+/i;

/**
 * Prefer structured git metadata from RunResult / Run (SDK RunGitInfo).
 * @see https://cursor.com/docs/sdk/typescript#waiting-without-streaming
 */
export function extractGitResultMetadata(
  result: Pick<RunResult, "git"> | Pick<Run, "git">
): ExtractedGitMetadata {
  const firstBranch = result.git?.branches?.[0];

  if (firstBranch?.prUrl || firstBranch?.branch) {
    return {
      prUrl: firstBranch.prUrl,
      branchName: firstBranch.branch,
    };
  }

  return {
    prUrl: findFirstStringMatch(result, (value) => {
      return value.match(githubPullRequestUrlPattern)?.[0];
    }),
    branchName: findFirstStringMatch(result, (value, key) => {
      const directBranch =
        key && ["branch", "branchName", "headRef"].includes(key)
          ? sanitizeCursorBranch(value)
          : undefined;

      return directBranch ?? sanitizeCursorBranch(value);
    }),
  };
}

/**
 * Maps SDK Run / RunResult into persisted fields. Final assistant text lives on
 * `result` (string) after the run completes — not in stream events alone.
 */
export type ExtractableRunPayload = Pick<
  RunResult,
  "result" | "git" | "durationMs"
> & {
  id?: string;
  status: RunStatus | RunResultStatus;
};

export function extractRunResult(
  result: ExtractableRunPayload | RunResult | Run
): ExtractedRunResult {
  const shouldSummarize =
    Boolean(result.result) && isTerminalStatus(result.status);

  return {
    ...extractGitResultMetadata(result),
    resultSummary: shouldSummarize
      ? summarizeResult(result.result!)
      : undefined,
    resultRawPayload: result,
    rawCursorStatus: result.status,
  };
}

export function summarizeResult(result: string) {
  const normalized = result.replace(/\s+/g, " ").trim();

  if (normalized.length <= 600) {
    return normalized;
  }

  return `${normalized.slice(0, 597)}...`;
}

export function artifactToRecord(artifact: SDKArtifact) {
  const name = artifact.path.split("/").filter(Boolean).at(-1) ?? artifact.path;

  return {
    artifactId: artifact.path,
    name,
    mimeType: undefined,
    size: artifact.sizeBytes,
    previewUrl: undefined,
    rawPayload: artifact,
  };
}

function findFirstStringMatch(
  value: unknown,
  getMatch: (value: string, key?: string) => string | undefined,
  seen = new WeakSet<object>(),
  key?: string,
  depth = 0
): string | undefined {
  if (depth > 8) {
    return undefined;
  }

  if (typeof value === "string") {
    return getMatch(value, key);
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  if (seen.has(value)) {
    return undefined;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findFirstStringMatch(
        item,
        getMatch,
        seen,
        undefined,
        depth + 1
      );

      if (match) {
        return match;
      }
    }

    return undefined;
  }

  for (const [childKey, childValue] of Object.entries(value)) {
    const match = findFirstStringMatch(
      childValue,
      getMatch,
      seen,
      childKey,
      depth + 1
    );

    if (match) {
      return match;
    }
  }

  return undefined;
}

function sanitizeCursorBranch(value: string) {
  const match = value.match(cursorBranchPattern)?.[0];

  return match?.replace(/[),.;:]+$/, "");
}
