import { describe, expect, it } from "vitest";

import {
  isTerminalStatus,
  normalizeCursorStatus,
} from "@/lib/cursor/status";

describe("normalizeCursorStatus", () => {
  it.each([
    ["CREATING", "creating"],
    ["RUNNING", "running"],
    ["FINISHED", "finished"],
    ["completed", "finished"],
    ["ERROR", "error"],
    ["failed", "error"],
    ["CANCELLED", "cancelled"],
    ["EXPIRED", "expired"],
  ])("maps %s to %s", (raw, normalized) => {
    expect(normalizeCursorStatus(raw)).toBe(normalized);
  });

  it("identifies terminal statuses", () => {
    expect(isTerminalStatus("finished")).toBe(true);
    expect(isTerminalStatus("running")).toBe(false);
  });
});
