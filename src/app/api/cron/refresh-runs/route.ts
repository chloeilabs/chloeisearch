import type { NextRequest } from "next/server";

import { handleApiError, noStoreJson } from "@/lib/api";
import { getEnv } from "@/lib/env";
import { refreshActiveRunsForCron } from "@/lib/agent-runs/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const cronSecret = getEnv().CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await refreshActiveRunsForCron(10);

    return noStoreJson({
      ok: true,
      checkedAt: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
