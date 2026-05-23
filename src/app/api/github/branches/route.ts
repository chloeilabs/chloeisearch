import { ApiError, handleApiError, noStoreJson } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { listGitHubBranchesForUser } from "@/lib/github/branches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const url = new URL(request.url);
    const repositoryUrl = url.searchParams.get("repoUrl");

    if (!repositoryUrl) {
      throw new ApiError(400, "Repository URL is required.");
    }

    const branches = await listGitHubBranchesForUser(user.id, repositoryUrl);

    return noStoreJson({ branches });
  } catch (error) {
    return handleApiError(error);
  }
}
