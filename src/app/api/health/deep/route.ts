import { handleApiError, noStoreJson } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { getDeepHealth } from "@/lib/health/checks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const report = await getDeepHealth(user.id);

    return noStoreJson(report, {
      status: report.status === "error" ? 503 : 200,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
