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

export function extractGitResultMetadata(
  result: Pick<RunResult, "git"> | Pick<Run, "git">
): ExtractedGitMetadata {
  const firstBranch = result.git?.branches?.[0];

  return {
    prUrl: firstBranch?.prUrl,
    branchName: firstBranch?.branch,
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
