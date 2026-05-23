import "server-only";

import { getEnv } from "@/lib/env";
import { fetchGitHubJson, getGitHubAccessToken } from "@/lib/github/client";
import { normalizeRepositoryUrl } from "@/lib/validation/repository";

const maxPages = 10;

export type GitHubRepository = {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  defaultBranch: string;
  url: string;
  pushedAt: string | null;
};

type GitHubApiRepository = {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  private: boolean;
  fork: boolean;
  archived: boolean;
  default_branch: string;
  html_url: string;
  pushed_at: string | null;
};

export async function listGitHubRepositoriesForUser(userId: string) {
  const token = await getGitHubAccessToken(userId);
  const repositories: GitHubRepository[] = [];
  const env = getEnv();

  for (let page = 1; page <= maxPages; page += 1) {
    const pageRepositories = await fetchGitHubRepositoryPage(token, page);

    repositories.push(
      ...pageRepositories
        .map((repository) => mapGitHubRepository(repository))
        .filter((repository) =>
          isAllowedGitHubRepository(repository, env.ALLOWED_GITHUB_ORGS)
        )
    );

    if (pageRepositories.length < 100) {
      break;
    }
  }

  return repositories.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function mapGitHubRepository(
  repository: GitHubApiRepository
): GitHubRepository {
  return {
    id: repository.id,
    name: repository.name,
    fullName: repository.full_name,
    owner: repository.owner.login,
    private: repository.private,
    fork: repository.fork,
    archived: repository.archived,
    defaultBranch: repository.default_branch,
    url: normalizeRepositoryUrl(repository.html_url),
    pushedAt: repository.pushed_at,
  };
}

async function fetchGitHubRepositoryPage(token: string, page: number) {
  const params = new URLSearchParams({
    visibility: "all",
    affiliation: "owner,collaborator,organization_member",
    sort: "full_name",
    direction: "asc",
    per_page: "100",
    page: String(page),
  });

  return fetchGitHubJson<GitHubApiRepository[]>(
    token,
    `/user/repos?${params}`,
    "Unable to load repositories from GitHub."
  );
}

function isAllowedGitHubRepository(
  repository: GitHubRepository,
  allowedGithubOrgs: string[]
) {
  if (allowedGithubOrgs.length === 0) {
    return true;
  }

  return allowedGithubOrgs.includes(repository.owner.toLowerCase());
}
