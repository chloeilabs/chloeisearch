import { handleApiError, noStoreJson } from "@/lib/api";
import { getRunCreationLimits } from "@/lib/agent-runs/limits";
import { requireCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const limits = await getRunCreationLimits(user.id);

    return noStoreJson({ limits });
  } catch (error) {
    return handleApiError(error);
  }
}
