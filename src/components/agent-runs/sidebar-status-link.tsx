"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActivityIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function SidebarStatusLink() {
  const pathname = usePathname();
  const active = pathname === "/status" || pathname.startsWith("/status/");

  return (
    <Link
      href="/status"
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
        active
          ? "bg-sidebar-active text-sidebar-active-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      <ActivityIcon className="size-3.5 opacity-70" />
      Status
    </Link>
  );
}
