import { handleApiError, noStoreJson } from "@/lib/api";
import { getBasicHealth } from "@/lib/health/checks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await getBasicHealth();

    return noStoreJson(report, {
      status: report.status === "error" ? 503 : 200,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
