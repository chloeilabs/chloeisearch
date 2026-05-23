import { handleApiError, noStoreJson } from "@/lib/api";
import { refreshAgentRun } from "@/lib/agent-runs/service";
import { requireCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;
    const run = await refreshAgentRun(user.id, id);

    return noStoreJson({ run });
  } catch (error) {
    return handleApiError(error);
  }
}
