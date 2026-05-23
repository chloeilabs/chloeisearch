import { handleApiError, noStoreJson } from "@/lib/api";
import { retryAgentRun } from "@/lib/agent-runs/service";
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
    assertRateLimit(`agent-run:retry:${user.id}`);

    const { id } = await params;
    const run = await retryAgentRun(user.id, id);

    return noStoreJson({ run }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
