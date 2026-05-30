import { ApiError, handleApiError, noStoreJson, readJson } from "@/lib/api";
import {
  getRunDetailForUser,
  updateRunTaskSummaryForUser,
} from "@/lib/agent-runs/repository";
import { requireCurrentUser } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { parseUpdateAgentRunInput } from "@/lib/validation/agent-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;
    const run = await getRunDetailForUser(user.id, id);

    if (!run) {
      throw new ApiError(404, "Run not found.");
    }

    return noStoreJson({ run });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser();
    assertRateLimit(`agent-run:patch:${user.id}`);

    const { id } = await params;
    const body = await readJson<unknown>(request);
    const { taskSummary } = parseUpdateAgentRunInput(body);
    const run = await updateRunTaskSummaryForUser(user.id, id, taskSummary);

    if (!run) {
      throw new ApiError(404, "Run not found.");
    }

    return noStoreJson({ run });
  } catch (error) {
    return handleApiError(error);
  }
}
