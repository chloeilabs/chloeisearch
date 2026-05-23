import "server-only";

import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { getGitHubAccessToken, fetchGitHubJson } from "@/lib/github/client";
import { listCursorModels } from "@/lib/cursor/models";

export type HealthStatus = "ok" | "degraded" | "error" | "skipped";

export type HealthCheck = {
  name: string;
  status: HealthStatus;
  message: string;
  latencyMs?: number;
};

export type HealthReport = {
  status: HealthStatus;
  checkedAt: string;
  checks: HealthCheck[];
};

export function summarizeHealth(checks: HealthCheck[]): HealthStatus {
  if (checks.some((check) => check.status === "error")) {
    return "error";
  }

  if (checks.some((check) => check.status === "degraded")) {
    return "degraded";
  }

  return "ok";
}

export async function getBasicHealth(): Promise<HealthReport> {
  const env = getEnv();
  const checks: HealthCheck[] = [
    {
      name: "database_config",
      status: env.DATABASE_URL ? "ok" : "error",
      message: env.DATABASE_URL ? "DATABASE_URL is configured." : "DATABASE_URL is missing.",
    },
    {
      name: "cursor_config",
      status: env.CURSOR_API_KEY ? "ok" : "error",
      message: env.CURSOR_API_KEY ? "CURSOR_API_KEY is configured." : "CURSOR_API_KEY is missing.",
    },
    {
      name: "github_oauth_config",
      status:
        process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
          ? "ok"
          : "error",
      message:
        process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
          ? "GitHub OAuth is configured."
          : "GitHub OAuth credentials are missing.",
    },
    {
      name: "access_gate",
      status:
        env.ALLOWED_GITHUB_USERS.length > 0 || env.ALLOWED_EMAILS.length > 0
          ? "ok"
          : "degraded",
      message:
        env.ALLOWED_GITHUB_USERS.length > 0 || env.ALLOWED_EMAILS.length > 0
          ? "Production sign-in allowlist is configured."
          : "No sign-in allowlist is configured.",
    },
  ];

  return {
    status: summarizeHealth(checks),
    checkedAt: new Date().toISOString(),
    checks,
  };
}

export async function getDeepHealth(userId: string): Promise<HealthReport> {
  const checks = await Promise.all([
    measureCheck("database", async () => {
      await prisma.$queryRaw`SELECT 1`;
      return "Database query succeeded.";
    }),
    measureCheck("cursor_api", async () => {
      const models = await listCursorModels();
      return `Cursor API reachable; ${models.length} model(s) available.`;
    }),
    measureCheck("github_api", async () => {
      const token = await getGitHubAccessToken(userId);
      const user = await fetchGitHubJson<{ login?: string }>(
        token,
        "/user",
        "Unable to reach GitHub API."
      );

      return user.login
        ? `GitHub API reachable as ${user.login}.`
        : "GitHub API reachable.";
    }),
    measureCheck("vercel_runtime", async () => {
      if (!process.env.VERCEL) {
        return "Not running on Vercel.";
      }

      const env = process.env.VERCEL_ENV ?? "unknown";
      const url = process.env.VERCEL_URL ?? "unknown";

      return `Vercel runtime detected (${env}, ${url}).`;
    }),
  ]);

  return {
    status: summarizeHealth(checks),
    checkedAt: new Date().toISOString(),
    checks,
  };
}

async function measureCheck(
  name: string,
  check: () => Promise<string>
): Promise<HealthCheck> {
  const startedAt = performance.now();

  try {
    const message = await check();

    return {
      name,
      status: "ok",
      message,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch (error) {
    return {
      name,
      status: "error",
      message:
        error instanceof Error ? error.message : "Unexpected health check failure.",
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }
}
