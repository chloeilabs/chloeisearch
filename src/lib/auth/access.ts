type AuthProfile = {
  login?: unknown;
  email?: unknown;
};

type AuthUser = {
  email?: string | null;
};

type AuthAccessConfig = {
  allowedGithubUsers?: string[];
  allowedEmails?: string[];
};

export function normalizeAccessList(values: string[] = []) {
  return values
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function getGitHubLogin(profile?: AuthProfile | null) {
  return typeof profile?.login === "string"
    ? profile.login.toLowerCase()
    : undefined;
}

export function getAuthEmail(
  profile?: AuthProfile | null,
  user?: AuthUser | null
) {
  const email =
    typeof profile?.email === "string" ? profile.email : user?.email;

  return email ? email.toLowerCase() : undefined;
}

export function isGitHubSignInAllowed({
  profile,
  user,
  allowedGithubUsers = [],
  allowedEmails = [],
}: {
  profile?: AuthProfile | null;
  user?: AuthUser | null;
} & AuthAccessConfig) {
  const githubUsers = normalizeAccessList(allowedGithubUsers);
  const emails = normalizeAccessList(allowedEmails);

  if (githubUsers.length === 0 && emails.length === 0) {
    return true;
  }

  const login = getGitHubLogin(profile);
  const email = getAuthEmail(profile, user);

  return Boolean(
    (login && githubUsers.includes(login)) ||
      (email && emails.includes(email))
  );
}
