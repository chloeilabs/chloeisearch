import { ApiError, handleApiError } from "@/lib/api";
import { getRunForUser } from "@/lib/agent-runs/repository";
import { downloadCloudAgentArtifact } from "@/lib/cursor/agent-service";
import {
  contentTypeForArtifactPath,
  getArtifactPreviewKind,
  isInlineArtifactPreview,
} from "@/lib/cursor/artifact-preview";
import { requireCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
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

    const contentType = contentTypeForArtifactPath(path);
    const previewKind = getArtifactPreviewKind(path, contentType);
    const url = new URL(request.url);
    const forceInline = url.searchParams.get("inline") === "1";
    const inline = forceInline || isInlineArtifactPreview(previewKind);
    const safeFilename = filename.replaceAll('"', "");

    return new Response(body, {
      headers: {
        "Cache-Control": inline ? "private, max-age=300" : "private, no-store",
        "Content-Disposition": inline
          ? `inline; filename="${safeFilename}"`
          : `attachment; filename="${safeFilename}"`,
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
