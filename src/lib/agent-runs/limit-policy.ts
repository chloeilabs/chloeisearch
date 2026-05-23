export type RunLimitCounts = {
  activeRuns: number;
  runsLast24Hours: number;
};

export type RunLimitConfig = {
  activeLimit: number;
  dailyLimit: number;
  perMinuteLimit: number;
};

export type RunCreationLimits = {
  activeRuns: number;
  activeLimit: number | null;
  remainingActiveRuns: number | null;
  runsLast24Hours: number;
  dailyLimit: number | null;
  remainingRunsLast24Hours: number | null;
  perMinuteLimit: number;
  canCreateRun: boolean;
  reasons: string[];
};

export function buildRunCreationLimits(
  counts: RunLimitCounts,
  config: RunLimitConfig
): RunCreationLimits {
  const activeLimit = normalizeLimit(config.activeLimit);
  const dailyLimit = normalizeLimit(config.dailyLimit);
  const reasons: string[] = [];

  if (activeLimit !== null && counts.activeRuns >= activeLimit) {
    reasons.push(
      `Active run limit reached (${counts.activeRuns}/${activeLimit}). Wait for a run to finish or cancel one.`
    );
  }

  if (dailyLimit !== null && counts.runsLast24Hours >= dailyLimit) {
    reasons.push(
      `24-hour run limit reached (${counts.runsLast24Hours}/${dailyLimit}). Try again after older runs roll out of the window.`
    );
  }

  return {
    activeRuns: counts.activeRuns,
    activeLimit,
    remainingActiveRuns:
      activeLimit === null ? null : Math.max(activeLimit - counts.activeRuns, 0),
    runsLast24Hours: counts.runsLast24Hours,
    dailyLimit,
    remainingRunsLast24Hours:
      dailyLimit === null
        ? null
        : Math.max(dailyLimit - counts.runsLast24Hours, 0),
    perMinuteLimit: config.perMinuteLimit,
    canCreateRun: reasons.length === 0,
    reasons,
  };
}

function normalizeLimit(limit: number) {
  return limit > 0 ? limit : null;
}
