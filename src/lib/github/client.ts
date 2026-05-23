import "server-only";

import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";

export const githubApiVersion = "2026-03-10";

type GitHubRequestOptions = {
  method?: "GET" | "PATCH" | "POST" | "DELETE";
  body?: unknown;
};

export async function getGitHubAccessToken(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    throw new ApiError(
      409,
      "GitHub access requires reconnecting your GitHub account."
    );
  }

  return account.access_token;
}

export async function fetchGitHubJson<T>(
  token: string,
  path: string,
  errorMessage: string,
  options: GitHubRequestOptions = {}
) {
  const response = await fetch(`https://api.github.com${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      "User-Agent": "chloei-cloud-agent-control-plane",
      "X-GitHub-Api-Version": githubApiVersion,
    },
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401) {
    throw new ApiError(401, "GitHub authorization has expired. Sign in again.");
  }

  if (response.status === 403) {
    throw new ApiError(403, "GitHub did not allow this repository request.");
  }

  if (response.status === 404) {
    throw new ApiError(404, "GitHub repository was not found or is not accessible.");
  }

  if (!response.ok) {
    throw new ApiError(response.status, errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchOptionalGitHubJson<T>(
  token: string,
  path: string,
  errorMessage: string,
  options: GitHubRequestOptions = {}
) {
  try {
    return await fetchGitHubJson<T>(token, path, errorMessage, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
