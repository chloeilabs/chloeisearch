import type { SDKMessage } from "@cursor/sdk";

export function getCursorEventType(event: SDKMessage | Record<string, unknown>) {
  return typeof event.type === "string" ? event.type : "unknown";
}

export function getCursorEventMessage(
  event: SDKMessage | Record<string, unknown>
) {
  if ("message" in event && typeof event.message === "string") {
    return event.message;
  }

  if ("text" in event && typeof event.text === "string") {
    return event.text;
  }

  if (
    event.type === "assistant" &&
    "message" in event &&
    typeof event.message === "object" &&
    event.message !== null &&
    "content" in event.message &&
    Array.isArray(event.message.content)
  ) {
    return event.message.content
      .filter((block) => block?.type === "text" && typeof block.text === "string")
      .map((block) => block.text)
      .join("\n")
      .trim();
  }

  if (event.type === "tool_call" && "name" in event) {
    const status =
      "status" in event && typeof event.status === "string"
        ? ` ${event.status}`
        : "";
    return `Tool ${String(event.name)}${status}`;
  }

  if (event.type === "status" && "status" in event) {
    return String(event.status);
  }

  return undefined;
}
