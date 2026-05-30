import type {
  SDKAssistantMessage,
  SDKMessage,
  SDKStatusMessage,
  SDKTaskMessage,
  SDKThinkingMessage,
  SDKToolUseMessage,
  SDKUserMessageEvent,
  TextBlock,
} from "@cursor/sdk";

export function getCursorEventType(
  event: SDKMessage | Record<string, unknown>
): string {
  if (typeof event.type === "string") {
    return event.type;
  }

  return "unknown";
}

/**
 * Human-readable line for the event log. Aligns with SDKMessage variants from
 * @see https://cursor.com/docs/sdk/typescript#stream-events
 */
export function getCursorEventMessage(
  event: SDKMessage | Record<string, unknown>
): string | undefined {
  if (!isSdkMessageShape(event)) {
    return undefined;
  }

  switch (event.type) {
    case "assistant":
      return extractTextFromContent(event.message.content);
    case "thinking":
      return formatThinkingMessage(event);
    case "tool_call":
      return formatToolCallMessage(event);
    case "status":
      return formatStatusMessage(event);
    case "task":
      return formatTaskMessage(event);
    case "user":
      return extractTextFromContent(event.message.content);
    case "system":
      return event.subtype === "init"
        ? "Run initialized"
        : "System event";
    case "request":
      return "Awaiting user input or approval";
    default:
      return undefined;
  }
}

function isSdkMessageShape(
  event: SDKMessage | Record<string, unknown>
): event is SDKMessage {
  return typeof event === "object" && event !== null && typeof event.type === "string";
}

function extractTextFromContent(
  content: Array<TextBlock | { type: string; text?: string }> | undefined
) {
  if (!content?.length) {
    return undefined;
  }

  const text = content
    .filter((block): block is TextBlock => block?.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return text || undefined;
}

function formatThinkingMessage(event: SDKThinkingMessage) {
  const text = event.text.trim();
  if (!text) {
    return undefined;
  }

  if (event.thinking_duration_ms != null) {
    return `${text} (${event.thinking_duration_ms}ms)`;
  }

  return text;
}

function formatToolCallMessage(event: SDKToolUseMessage) {
  const truncated =
    event.truncated?.args || event.truncated?.result ? " (truncated)" : "";
  return `Tool ${event.name} ${event.status}${truncated}`.trim();
}

function formatStatusMessage(event: SDKStatusMessage) {
  if (event.message?.trim()) {
    return `${event.status}: ${event.message.trim()}`;
  }

  return event.status;
}

function formatTaskMessage(event: SDKTaskMessage) {
  const parts = [event.status, event.text].filter(
    (part): part is string => typeof part === "string" && part.trim().length > 0
  );

  return parts.length > 0 ? parts.join(": ") : undefined;
}

/** @internal Exported for tests */
export function getAssistantMessageText(event: SDKAssistantMessage) {
  return extractTextFromContent(event.message.content);
}

/** @internal Exported for tests */
export function getUserMessageText(event: SDKUserMessageEvent) {
  return extractTextFromContent(event.message.content);
}
