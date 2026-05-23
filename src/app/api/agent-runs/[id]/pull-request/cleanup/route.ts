import { handleApiError, noStoreJson } from "@/lib/api";
import { cleanupRunPullRequest } from "@/lib/agent-runs/pull-request-service";
import { requireCurrentUser } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser();
    assertRateLimit(`agent-run:pr-cleanup:${user.id}`);

    const { id } = await params;
    const result = await cleanupRunPullRequest(user.id, id);

    return noStoreJson(result);
  } catch (error) {
    return handleApiError(error);
  }
}
