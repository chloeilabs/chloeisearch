import { NextResponse } from "next/server";
import { ZodError } from "zod";

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
    return noStoreJson(
      { error: error.message, details: error.details },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
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

  return noStoreJson({ error: message }, { status: 500 });
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "Expected a valid JSON request body.");
  }
}
