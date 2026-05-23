import { ApiError, handleApiError } from "@/lib/api";
import { getRunForUser } from "@/lib/agent-runs/repository";
import { downloadCloudAgentArtifact } from "@/lib/cursor/agent-service";
import { requireCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; artifactPath: string[] }> }
) {
  try {
    const user = await requireCurrentUser();
    const { id, artifactPath } = await params;
    const run = await getRunForUser(user.id, id);

    if (!run) {
      throw new ApiError(404, "Run not found.");
    }

    if (!run.cursorAgentId) {
      throw new ApiError(409, "Run does not have a Cursor agent ID.");
    }

    const path = artifactPath.join("/");
    const buffer = await downloadCloudAgentArtifact(run.cursorAgentId, path);
    const filename = path.split("/").filter(Boolean).at(-1) ?? "artifact";
    const body = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    return new Response(body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${filename.replaceAll('"', "")}"`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
