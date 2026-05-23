import { describe, expect, it } from "vitest";

import { isGitHubSignInAllowed } from "@/lib/auth/access";

describe("isGitHubSignInAllowed", () => {
  it("allows everyone when no allowlist is configured", () => {
    expect(
      isGitHubSignInAllowed({
        profile: { login: "anyone", email: "anyone@example.com" },
      })
    ).toBe(true);
  });

  it("allows configured GitHub users case-insensitively", () => {
    expect(
      isGitHubSignInAllowed({
        profile: { login: "ChloeiLabs" },
        allowedGithubUsers: ["chloeilabs"],
      })
    ).toBe(true);
  });

  it("allows configured email addresses case-insensitively", () => {
    expect(
      isGitHubSignInAllowed({
        user: { email: "Labs@Chloei.ai" },
        allowedEmails: ["labs@chloei.ai"],
      })
    ).toBe(true);
  });

  it("denies users outside the allowlist", () => {
    expect(
      isGitHubSignInAllowed({
        profile: { login: "other", email: "other@example.com" },
        allowedGithubUsers: ["chloeilabs"],
        allowedEmails: ["labs@chloei.ai"],
      })
    ).toBe(false);
  });
});
