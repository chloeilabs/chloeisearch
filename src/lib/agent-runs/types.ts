import type { NormalizedRunStatus } from "@/lib/cursor/status";

export const runStatusFilters = [
  "creating",
  "running",
  "finished",
  "error",
  "cancelled",
  "expired",
] as const satisfies readonly NormalizedRunStatus[];

export const runStatusLabels: Record<NormalizedRunStatus, string> = {
  creating: "Creating",
  running: "Running",
  finished: "Finished",
  error: "Error",
  cancelled: "Cancelled",
  expired: "Expired",
};
