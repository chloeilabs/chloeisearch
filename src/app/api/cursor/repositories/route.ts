import { handleApiError, noStoreJson } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { listCursorRepositories } from "@/lib/cursor/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCurrentUser();
    const repositories = await listCursorRepositories();

    return noStoreJson({ repositories });
  } catch (error) {
    return handleApiError(error);
  }
}
