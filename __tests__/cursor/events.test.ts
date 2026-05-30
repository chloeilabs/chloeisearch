import { describe, expect, it } from "vitest";

import {
  getAssistantMessageText,
  getCursorEventMessage,
  getCursorEventType,
  getUserMessageText,
} from "@/lib/cursor/events";

const baseIds = { agent_id: "bc-1", run_id: "run-1" };

describe("getCursorEventType", () => {
  it("returns SDK message type", () => {
    expect(
      getCursorEventType({
        type: "status",
        ...baseIds,
        status: "RUNNING",
      })
    ).toBe("status");
  });

  it("returns unknown for malformed payloads", () => {
    expect(getCursorEventType({})).toBe("unknown");
  });
});

describe("getCursorEventMessage", () => {
  it("extracts assistant text blocks", () => {
    expect(
      getCursorEventMessage({
        type: "assistant",
        ...baseIds,
        message: {
          role: "assistant",
          content: [
            { type: "text", text: "Hello" },
            { type: "tool_use", id: "t1", name: "shell", input: {} },
          ],
        },
      })
    ).toBe("Hello");
  });

  it("formats thinking with duration", () => {
    expect(
      getCursorEventMessage({
        type: "thinking",
        ...baseIds,
        text: "Planning",
        thinking_duration_ms: 1200,
      })
    ).toBe("Planning (1200ms)");
  });

  it("formats tool_call lifecycle", () => {
    expect(
      getCursorEventMessage({
        type: "tool_call",
        ...baseIds,
        call_id: "c1",
        name: "read",
        status: "completed",
        truncated: { result: true },
      })
    ).toBe("Tool read completed (truncated)");
  });

  it("formats status with optional message", () => {
    expect(
      getCursorEventMessage({
        type: "status",
        ...baseIds,
        status: "CREATING",
        message: "Provisioning VM",
      })
    ).toBe("CREATING: Provisioning VM");
  });

  it("formats task milestones", () => {
    expect(
      getCursorEventMessage({
        type: "task",
        ...baseIds,
        status: "done",
        text: "Summary ready",
      })
    ).toBe("done: Summary ready");
  });

  it("extracts user prompt echo", () => {
    expect(
      getCursorEventMessage({
        type: "user",
        ...baseIds,
        message: {
          role: "user",
          content: [{ type: "text", text: "Fix the bug" }],
        },
      })
    ).toBe("Fix the bug");
  });

  it("handles system init", () => {
    expect(
      getCursorEventMessage({
        type: "system",
        subtype: "init",
        ...baseIds,
      })
    ).toBe("Run initialized");
  });
});

describe("message helpers", () => {
  it("exports typed assistant and user extractors", () => {
    const assistant = {
      type: "assistant" as const,
      ...baseIds,
      message: {
        role: "assistant" as const,
        content: [{ type: "text" as const, text: "Done" }],
      },
    };

    expect(getAssistantMessageText(assistant)).toBe("Done");
    expect(
      getUserMessageText({
        type: "user",
        ...baseIds,
        message: {
          role: "user",
          content: [{ type: "text", text: "Hi" }],
        },
      })
    ).toBe("Hi");
  });
});
