import "server-only";

import { getEnv } from "@/lib/env";
import { fetchGitHubJson, getGitHubAccessToken } from "@/lib/github/client";
import { normalizeRepositoryUrl } from "@/lib/validation/repository";

const maxPages = 10;

export type GitHubBranch = {
  name: string;
  commitSha: string;
  protected: boolean;
};

type GitHubApiBranch = {
  name: string;
  commit: {
    sha: string;
  };
  protected: boolean;
};

export async function listGitHubBranchesForUser(
  userId: string,
  repositoryUrl: string
) {
  const token = await getGitHubAccessToken(userId);
  const repository = parseGitHubRepositoryUrl(repositoryUrl);
  const branches: GitHubBranch[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const pageBranches = await fetchGitHubBranchPage(
      token,
      repository.owner,
      repository.repo,
      page
    );

    branches.push(...pageBranches.map(mapGitHubBranch));

    if (pageBranches.length < 100) {
      break;
    }
  }

  return branches.sort((a, b) => a.name.localeCompare(b.name));
}

export function parseGitHubRepositoryUrl(repositoryUrl: string) {
  const env = getEnv();
  const normalizedUrl = normalizeRepositoryUrl(repositoryUrl, {
    allowedHosts: env.ALLOWED_GIT_HOSTS,
    allowedGithubOrgs: env.ALLOWED_GITHUB_ORGS.map((org) => org.toLowerCase()),
  });
  const url = new URL(normalizedUrl);
  const [owner, repo] = url.pathname.replace(/^\/|\/$/g, "").split("/");

  if (!owner || !repo || url.hostname !== "github.com") {
    throw new Error("Branch discovery currently requires a GitHub repository URL.");
  }

  return { owner, repo };
}

export function mapGitHubBranch(branch: GitHubApiBranch): GitHubBranch {
  return {
    name: branch.name,
    commitSha: branch.commit.sha,
    protected: branch.protected,
  };
}

async function fetchGitHubBranchPage(
  token: string,
  owner: string,
  repo: string,
  page: number
) {
  const params = new URLSearchParams({
    per_page: "100",
    page: String(page),
  });

  return fetchGitHubJson<GitHubApiBranch[]>(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?${params}`,
    "Unable to load branches from GitHub."
  );
}
