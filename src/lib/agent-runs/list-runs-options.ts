import type { NormalizedRunStatus } from "@/lib/cursor/status";

export type ListRunsForUserOptions = {
  status?: NormalizedRunStatus;
  archived?: "active" | "archived" | "all";
};

export function resolveListRunsForUserOptions(
  options?: ListRunsForUserOptions | NormalizedRunStatus
): ListRunsForUserOptions {
  return typeof options === "string"
    ? { status: options, archived: "active" }
    : { archived: "active", ...options };
}

export function buildArchivedAtWhere(archived: ListRunsForUserOptions["archived"]) {
  if (archived === "archived") {
    return { archivedAt: { not: null } };
  }

  if (archived === "all") {
    return {};
  }

  return { archivedAt: null };
}
