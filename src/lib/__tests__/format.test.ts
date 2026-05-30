import { describe, expect, it, vi } from "vitest";

import { formatRelativeTime } from "@/lib/format";

describe("formatRelativeTime", () => {
  it("formats past times relative to now", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-30T12:00:00Z"));

    expect(formatRelativeTime("2026-05-30T11:00:00Z")).toMatch(/hour/i);

    vi.useRealTimers();
  });
});
