import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  GitBranchIcon,
  GitPullRequestIcon,
  Loader2Icon,
} from "lucide-react";

import type { NormalizedRunStatus } from "@/lib/cursor/status";
import { cn } from "@/lib/utils";

export function RunSidebarIcon({
  status,
  hasPr,
  className,
}: {
  status: string;
  hasPr?: boolean;
  className?: string;
}) {
  const normalized = status as NormalizedRunStatus;

  if (normalized === "creating" || normalized === "running") {
    return (
      <Loader2Icon
        className={cn("size-3.5 shrink-0 animate-spin text-muted-foreground", className)}
      />
    );
  }

  if (hasPr) {
    if (normalized === "finished") {
      return (
        <GitPullRequestIcon
          className={cn("size-3.5 shrink-0 text-green-500", className)}
        />
      );
    }
    return (
      <GitPullRequestIcon
        className={cn("size-3.5 shrink-0 text-muted-foreground/70", className)}
      />
    );
  }

  if (normalized === "finished") {
    return (
      <CheckCircle2Icon
        className={cn("size-3.5 shrink-0 text-green-500", className)}
      />
    );
  }

  if (normalized === "error" || normalized === "expired") {
    return (
      <AlertTriangleIcon
        className={cn("size-3.5 shrink-0 text-red-500", className)}
      />
    );
  }

  return (
    <GitBranchIcon
      className={cn("size-3.5 shrink-0 text-muted-foreground/60", className)}
    />
  );
}
