import { handleApiError, noStoreJson } from "@/lib/api";
import { cancelAgentRun } from "@/lib/agent-runs/service";
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
    assertRateLimit(`agent-run:cancel:${user.id}`);

    const { id } = await params;
    const run = await cancelAgentRun(user.id, id);

    return noStoreJson({ run });
  } catch (error) {
    return handleApiError(error);
  }
}
