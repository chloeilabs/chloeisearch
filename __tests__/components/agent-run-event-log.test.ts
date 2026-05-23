import { describe, expect, it } from "vitest";

import {
  isTerminalCursorStatusEvent,
  type EventLogItem,
} from "@/components/agent-runs/agent-run-event-log";

function event(rawPayload: unknown): EventLogItem {
  return {
    id: "event-1",
    sequenceNumber: 1,
    eventType: "status",
    messageText: null,
    rawPayload,
    createdAt: new Date("2026-05-23T00:00:00.000Z"),
  };
}

describe("isTerminalCursorStatusEvent", () => {
  it.each(["FINISHED", "ERROR", "CANCELLED", "EXPIRED"])(
    "detects terminal status %s",
    (status) => {
      expect(isTerminalCursorStatusEvent(event({ status }))).toBe(true);
    }
  );

  it("ignores non-terminal status events", () => {
    expect(isTerminalCursorStatusEvent(event({ status: "RUNNING" }))).toBe(
      false
    );
  });

  it("ignores non-status event types and malformed payloads", () => {
    expect(
      isTerminalCursorStatusEvent({
        ...event({ status: "FINISHED" }),
        eventType: "assistant",
      })
    ).toBe(false);
    expect(isTerminalCursorStatusEvent(event(null))).toBe(false);
  });
});
