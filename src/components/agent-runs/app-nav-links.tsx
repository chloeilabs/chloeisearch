"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActivityIcon, ListIcon, PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  {
    href: "/runs",
    label: "Agent runs",
    icon: ListIcon,
    match: (path: string) =>
      path === "/runs" ||
      (path.startsWith("/runs/") && path !== "/runs/new"),
  },
  {
    href: "/runs/new",
    label: "New agent",
    icon: PlusIcon,
    match: (path: string) => path === "/runs/new",
  },
  {
    href: "/status",
    label: "Status",
    icon: ActivityIcon,
    match: (path: string) => path === "/status",
  },
] as const;

export function AppNavLinks({ layout = "sidebar" }: { layout?: "sidebar" | "bar" }) {
  const pathname = usePathname();

  if (layout === "bar") {
    return (
      <nav
        className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1"
        aria-label="Primary"
      >
        {links.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-3.5 shrink-0 opacity-80" />
              {label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-3" aria-label="Primary">
      {links.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "cursor-sidebar-item",
              active ? "cursor-sidebar-item-active" : "cursor-sidebar-item-inactive"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0 opacity-90" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
