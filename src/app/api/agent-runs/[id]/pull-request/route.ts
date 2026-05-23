import { handleApiError, noStoreJson } from "@/lib/api";
import { getRunPullRequestLifecycle } from "@/lib/agent-runs/pull-request-service";
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
    const pullRequest = await getRunPullRequestLifecycle(user.id, id);

    return noStoreJson({ pullRequest });
  } catch (error) {
    return handleApiError(error);
  }
}
