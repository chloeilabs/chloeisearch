import { describe, expect, it } from "vitest";

import { buildRunCreationLimits } from "@/lib/agent-runs/limit-policy";

describe("buildRunCreationLimits", () => {
  it("allows run creation when configured limits have capacity", () => {
    const limits = buildRunCreationLimits(
      { activeRuns: 1, runsLast24Hours: 4 },
      { activeLimit: 3, dailyLimit: 25, perMinuteLimit: 10 }
    );

    expect(limits.canCreateRun).toBe(true);
    expect(limits.remainingActiveRuns).toBe(2);
    expect(limits.remainingRunsLast24Hours).toBe(21);
    expect(limits.reasons).toEqual([]);
  });

  it("blocks run creation when active or daily limits are reached", () => {
    const limits = buildRunCreationLimits(
      { activeRuns: 3, runsLast24Hours: 25 },
      { activeLimit: 3, dailyLimit: 25, perMinuteLimit: 10 }
    );

    expect(limits.canCreateRun).toBe(false);
    expect(limits.remainingActiveRuns).toBe(0);
    expect(limits.remainingRunsLast24Hours).toBe(0);
    expect(limits.reasons).toHaveLength(2);
  });

  it("treats zero limits as disabled", () => {
    const limits = buildRunCreationLimits(
      { activeRuns: 100, runsLast24Hours: 100 },
      { activeLimit: 0, dailyLimit: 0, perMinuteLimit: 10 }
    );

    expect(limits.canCreateRun).toBe(true);
    expect(limits.activeLimit).toBeNull();
    expect(limits.dailyLimit).toBeNull();
    expect(limits.remainingActiveRuns).toBeNull();
    expect(limits.remainingRunsLast24Hours).toBeNull();
  });
});
