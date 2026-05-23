import { describe, expect, it } from "vitest";

import { normalizeRepositoryUrl } from "@/lib/validation/repository";

describe("normalizeRepositoryUrl", () => {
  it("normalizes GitHub repository URLs", () => {
    expect(
      normalizeRepositoryUrl("https://github.com/Acme/web.git")
    ).toBe("https://github.com/Acme/web");
  });

  it("rejects credentials and fragments", () => {
    expect(() =>
      normalizeRepositoryUrl("https://token@github.com/acme/web#main")
    ).toThrow("credentials or fragments");
  });

  it("enforces allowed hosts", () => {
    expect(() =>
      normalizeRepositoryUrl("https://gitlab.com/acme/web", {
        allowedHosts: ["github.com"],
      })
    ).toThrow("not allowed");
  });

  it("enforces allowed GitHub organizations", () => {
    expect(() =>
      normalizeRepositoryUrl("https://github.com/other/web", {
        allowedGithubOrgs: ["acme"],
      })
    ).toThrow("not allowed");
  });
});
