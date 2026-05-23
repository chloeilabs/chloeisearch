import { handleApiError, noStoreJson } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { listGitHubRepositoriesForUser } from "@/lib/github/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const repositories = await listGitHubRepositoriesForUser(user.id);

    return noStoreJson({ repositories });
  } catch (error) {
    return handleApiError(error);
  }
}
