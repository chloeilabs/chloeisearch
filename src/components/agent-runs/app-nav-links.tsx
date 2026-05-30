"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActivityIcon, ListIcon, PlusIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/runs", label: "Runs", icon: ListIcon, match: (path: string) => path === "/runs" || path.startsWith("/runs/") && path !== "/runs/new" },
  { href: "/runs/new", label: "New run", icon: PlusIcon, match: (path: string) => path === "/runs/new" },
  { href: "/status", label: "Status", icon: ActivityIcon, match: (path: string) => path === "/status" },
] as const;

export function AppNavLinks() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1"
      aria-label="Primary"
    >
      {links.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              buttonVariants({
                variant: active ? "secondary" : "ghost",
                size: "sm",
              }),
              "gap-1.5 shadow-none"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
