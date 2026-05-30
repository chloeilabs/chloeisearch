import { handleApiError, noStoreJson, readJson } from "@/lib/api";
import { listRunsForUser } from "@/lib/agent-runs/repository";
import { runStatusFilters } from "@/lib/agent-runs/types";
import { startAgentRun } from "@/lib/agent-runs/service";
import { requireCurrentUser } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { parseCreateAgentRunInput } from "@/lib/validation/agent-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const normalizedStatus = runStatusFilters.find((item) => item === status);
    const runs = await listRunsForUser(user.id, {
      status: normalizedStatus,
      archived: "active",
    });

    return noStoreJson({ runs });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    assertRateLimit(`agent-run:create:${user.id}`);

    const body = await readJson<unknown>(request);
    const input = parseCreateAgentRunInput(body);
    const run = await startAgentRun(user.id, input);

    return noStoreJson({ run }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
