"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActivityIcon, ListIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  {
    href: "/runs",
    label: "Agents",
    icon: ListIcon,
    match: (path: string) =>
      path === "/runs" ||
      (path.startsWith("/runs/") && path !== "/runs/new"),
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
        <Link
          href="/runs/new"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
            pathname === "/runs/new"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
          aria-current={pathname === "/runs/new" ? "page" : undefined}
        >
          New agent
        </Link>
      </nav>
    );
  }

  return (
    <nav className="shrink-0 px-2 py-2" aria-label="Primary">
      <p className="cursor-sidebar-label">Workspace</p>
      <div className="flex flex-col gap-0.5">
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
      </div>
    </nav>
  );
}
