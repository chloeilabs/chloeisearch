import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { logError, logWarn } from "@/lib/observability/logger";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function noStoreJson<T>(data: T, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status >= 500) {
      logError("api.error", error, { status: error.status });
    } else if (error.status >= 400 && error.status !== 401) {
      logWarn("api.rejected", {
        status: error.status,
        errorMessage: error.message,
      });
    }

    return noStoreJson(
      { error: error.message, details: error.details },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    logWarn("api.validation_failed", {
      issueCount: error.issues.length,
    });

    return noStoreJson(
      { error: "Invalid request input.", details: error.flatten() },
      { status: 400 }
    );
  }

  if (error instanceof Error && error.message === "Unauthorized") {
    return noStoreJson({ error: "Unauthorized" }, { status: 401 });
  }

  const message =
    error instanceof Error ? error.message : "Unexpected server error.";

  logError("api.unhandled_error", error, { status: 500 });

  return noStoreJson({ error: message }, { status: 500 });
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "Expected a valid JSON request body.");
  }
}
