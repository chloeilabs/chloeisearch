import { ApiError, handleApiError, noStoreJson } from "@/lib/api";
import {
  getRunForUser,
  listRunEventsForUser,
} from "@/lib/agent-runs/repository";
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

    const events = await listRunEventsForUser(user.id, id);

    return noStoreJson({ events });
  } catch (error) {
    return handleApiError(error);
  }
}
