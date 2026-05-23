export type GitHubRepositoryCatalogItem = {
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

export type CursorRepositoryCatalogItem = {
  url: string;
};

export type RepositoryCatalogItem = {
  url: string;
  label: string;
  owner?: string;
  defaultBranch?: string;
  private?: boolean;
  fork?: boolean;
  archived?: boolean;
  githubAvailable: boolean;
  cursorConnected: boolean;
};

export function mergeRepositoryCatalogs(
  githubRepositories: GitHubRepositoryCatalogItem[],
  cursorRepositories: CursorRepositoryCatalogItem[]
) {
  const byUrl = new Map<string, RepositoryCatalogItem>();

  for (const repository of githubRepositories) {
    byUrl.set(repository.url, {
      url: repository.url,
      label: repository.fullName,
      owner: repository.owner,
      defaultBranch: repository.defaultBranch,
      private: repository.private,
      fork: repository.fork,
      archived: repository.archived,
      githubAvailable: true,
      cursorConnected: false,
    });
  }

  for (const repository of cursorRepositories) {
    const existing = byUrl.get(repository.url);

    if (existing) {
      existing.cursorConnected = true;
      continue;
    }

    byUrl.set(repository.url, {
      url: repository.url,
      label: labelFromRepositoryUrl(repository.url),
      githubAvailable: false,
      cursorConnected: true,
    });
  }

  return Array.from(byUrl.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

export function labelFromRepositoryUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const [owner, repo] = parsedUrl.pathname
      .replace(/^\/|\/$/g, "")
      .replace(/\.git$/, "")
      .split("/");

    return owner && repo ? `${owner}/${repo}` : url;
  } catch {
    return url;
  }
}
