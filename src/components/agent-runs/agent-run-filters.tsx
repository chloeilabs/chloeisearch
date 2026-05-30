"use client";

import Link from "next/link";

import { runStatusFilters, runStatusLabels } from "@/lib/agent-runs/types";
import { cn } from "@/lib/utils";

export function AgentRunFilters({
  activeStatus,
  showArchived = false,
}: {
  activeStatus?: string;
  showArchived?: boolean;
}) {
  if (showArchived) {
    return (
      <nav
        className="mb-4 flex flex-wrap items-center gap-1 text-[13px]"
        aria-label="Archived agents"
      >
        <Link
          href="/runs"
          className="rounded px-1 py-0.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Active agents
        </Link>
      </nav>
    );
  }

  const items = [
    { href: "/runs", label: "Overview", active: !activeStatus },
    ...runStatusFilters.map((status) => ({
      href: `/runs?status=${status}`,
      label: runStatusLabels[status],
      active: activeStatus === status,
    })),
    { href: "/runs?archived=1", label: "Archived", active: false },
  ];

  return (
    <nav
      className="mb-4 flex flex-wrap items-center gap-1 text-[13px]"
      aria-label="Filter by status"
    >
      {items.map((item, index) => (
        <span key={item.href} className="inline-flex items-center gap-1">
          {index > 0 ? (
            <span className="text-muted-foreground/35" aria-hidden>
              ·
            </span>
          ) : null}
          <Link
            href={item.href}
            className={cn(
              "rounded px-1 py-0.5 transition-colors",
              item.active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={item.active ? "page" : undefined}
          >
            {item.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
