import { handleApiError, noStoreJson } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { listCursorModels } from "@/lib/cursor/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCurrentUser();
    const models = await listCursorModels();

    return noStoreJson({ models });
  } catch (error) {
    return handleApiError(error);
  }
}
