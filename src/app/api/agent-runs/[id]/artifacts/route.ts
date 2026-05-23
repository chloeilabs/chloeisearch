import { ApiError, handleApiError, noStoreJson } from "@/lib/api";
import {
  getRunDetailForUser,
  getRunForUser,
} from "@/lib/agent-runs/repository";
import { syncRunArtifacts } from "@/lib/agent-runs/service";
import { requireCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;
    const run = await getRunForUser(user.id, id);

    if (!run) {
      throw new ApiError(404, "Run not found.");
    }

    if (run.cursorAgentId) {
      await syncRunArtifacts(run.id, run.cursorAgentId);
    }

    const detail = await getRunDetailForUser(user.id, id);

    return noStoreJson({ artifacts: detail?.artifacts ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}
