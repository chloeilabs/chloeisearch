import { z } from "zod";

export type RepositoryValidationOptions = {
  allowedHosts?: string[];
  allowedGithubOrgs?: string[];
};

const githubPathSchema = z
  .string()
  .regex(
    /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/,
    "Repository URL must point to a GitHub owner/repository path."
  );

export function normalizeRepositoryUrl(
  input: string,
  options: RepositoryValidationOptions = {}
) {
  const allowedHosts = options.allowedHosts?.length
    ? options.allowedHosts
    : ["github.com"];
  const allowedGithubOrgs = options.allowedGithubOrgs ?? [];
  let url: URL;

  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Repository URL must be a valid URL.");
  }

  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("Repository URL must use http or https.");
  }

  if (url.username || url.password || url.hash) {
    throw new Error("Repository URL cannot include credentials or fragments.");
  }

  const hostname = url.hostname.toLowerCase();
  if (!allowedHosts.includes(hostname)) {
    throw new Error(`Repository host ${hostname} is not allowed.`);
  }

  if (hostname === "github.com") {
    githubPathSchema.parse(url.pathname);

    const [, owner, repoWithGit] = url.pathname.replace(/\/$/, "").split("/");
    const repo = repoWithGit.replace(/\.git$/, "");

    if (
      allowedGithubOrgs.length > 0 &&
      !allowedGithubOrgs.includes(owner.toLowerCase())
    ) {
      throw new Error(`GitHub owner ${owner} is not allowed.`);
    }

    return `https://github.com/${owner}/${repo}`;
  }

  if (url.pathname.length < 3) {
    throw new Error("Repository URL must include a repository path.");
  }

  url.protocol = "https:";
  url.username = "";
  url.password = "";
  url.hash = "";
  url.search = "";

  return url.toString().replace(/\/$/, "");
}
