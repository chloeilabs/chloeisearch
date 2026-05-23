export type NormalizedRunStatus =
  | "creating"
  | "running"
  | "finished"
  | "error"
  | "cancelled"
  | "expired";

export const terminalStatuses = new Set<NormalizedRunStatus>([
  "finished",
  "error",
  "cancelled",
  "expired",
]);

export function normalizeCursorStatus(status: unknown): NormalizedRunStatus {
  const raw = String(status ?? "").toLowerCase();

  switch (raw) {
    case "creating":
      return "creating";
    case "running":
      return "running";
    case "finished":
    case "completed":
    case "complete":
      return "finished";
    case "error":
    case "failed":
    case "failure":
      return "error";
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "expired":
      return "expired";
    default:
      return "running";
  }
}

export function isTerminalStatus(status: unknown) {
  return terminalStatuses.has(normalizeCursorStatus(status));
}
