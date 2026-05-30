"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArchiveIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function SidebarArchivedLink() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname === "/runs" && searchParams.get("archived") === "1";

  return (
    <Link
      href="/runs?archived=1"
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
        active
          ? "bg-sidebar-active text-sidebar-active-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      <ArchiveIcon className="size-3.5 opacity-70" />
      Archived
    </Link>
  );
}
