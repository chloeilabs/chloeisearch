import type { Run, RunResult, SDKArtifact } from "@cursor/sdk";

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

export function extractGitResultMetadata(
  result: Pick<RunResult, "git"> | Pick<Run, "git">
): ExtractedGitMetadata {
  const firstBranch = result.git?.branches?.[0];

  return {
    prUrl: firstBranch?.prUrl ?? findFirstStringMatch(result, (value) => {
      return value.match(githubPullRequestUrlPattern)?.[0];
    }),
    branchName:
      firstBranch?.branch ??
      findFirstStringMatch(result, (value, key) => {
        const directBranch =
          key && ["branch", "branchName", "headRef"].includes(key)
            ? sanitizeCursorBranch(value)
            : undefined;

        return directBranch ?? sanitizeCursorBranch(value);
      }),
  };
}

export function extractRunResult(result: RunResult | Run): ExtractedRunResult {
  return {
    ...extractGitResultMetadata(result),
    resultSummary: result.result ? summarizeResult(result.result) : undefined,
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
