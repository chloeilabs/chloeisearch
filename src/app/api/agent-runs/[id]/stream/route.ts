import { ApiError, handleApiError } from "@/lib/api";
import {
  createRunEvent,
  getRunForUser,
} from "@/lib/agent-runs/repository";
import {
  finalizeRunFromCursor,
  persistCursorEvent,
} from "@/lib/agent-runs/service";
import { streamCloudAgentRunEvents } from "@/lib/cursor/agent-service";
import { requireCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function encodeSse(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;
    const run = await getRunForUser(user.id, id);

    if (!run) {
      throw new ApiError(404, "Run not found.");
    }

    if (!run.cursorAgentId || !run.cursorRunId) {
      throw new ApiError(409, "Run has not been created in Cursor yet.");
    }

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encodeSse(event, data));
        };

        send("connected", { runId: run.id });

        try {
          for await (const event of streamCloudAgentRunEvents(
            run.cursorAgentId!,
            run.cursorRunId!
          )) {
            if (request.signal.aborted) {
              break;
            }

            const persisted = await persistCursorEvent(run.id, event);
            send("cursor-event", persisted);
          }

          if (!request.signal.aborted) {
            const result = await finalizeRunFromCursor(
              run.id,
              run.cursorAgentId!,
              run.cursorRunId!
            );
            send("done", result);
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Stream disconnected.";

          await createRunEvent({
            agentRunId: run.id,
            eventType: "app.stream_error",
            messageText: message,
            rawPayload: { message },
          });

          send("error", { message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
