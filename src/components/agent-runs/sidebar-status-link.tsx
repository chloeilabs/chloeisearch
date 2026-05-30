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
        "cursor-sidebar-item",
        active ? "cursor-sidebar-item-active" : "cursor-sidebar-item-inactive"
      )}
      aria-current={active ? "page" : undefined}
    >
      <ActivityIcon className="size-3.5 opacity-70" />
      Status
    </Link>
  );
}
