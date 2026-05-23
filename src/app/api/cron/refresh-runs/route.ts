import type { NextRequest } from "next/server";

import { handleApiError, noStoreJson } from "@/lib/api";
import { getEnv } from "@/lib/env";
import { refreshActiveRunsForCron } from "@/lib/agent-runs/service";
import { logInfo, logWarn } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const env = getEnv();
    const cronSecret = env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      logWarn("cron.refresh_runs.unauthorized", {
        hasCronSecret: Boolean(cronSecret),
        hasAuthorizationHeader: Boolean(authHeader),
      });
      return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await refreshActiveRunsForCron(env.CRON_REFRESH_BATCH_SIZE);
    logInfo("cron.refresh_runs.response", {
      checked: result.checked,
      succeeded: result.results.filter((item) => item.ok).length,
      failed: result.results.filter((item) => !item.ok).length,
    });

    return noStoreJson({
      ok: true,
      checkedAt: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
