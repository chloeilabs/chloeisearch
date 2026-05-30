import Link from "next/link";
import { ActivityIcon, PlusIcon } from "lucide-react";

import { SidebarRecentRuns } from "@/components/agent-runs/sidebar-recent-runs";
import { UserMenu } from "@/components/agent-runs/user-menu";
import { SignOutMenuItem } from "@/components/auth/sign-out-menu-item";
import { CursorBrandMark } from "@/components/brand/cursor-brand-mark";
import { Button } from "@/components/ui/button";
import { listRunsForUser } from "@/lib/agent-runs/repository";
import type { CurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export async function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const sidebarRuns = (await listRunsForUser(user.id)).slice(0, 24);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2 px-3 py-3">
          <Link
            href="/runs"
            className="flex min-w-0 flex-1 items-center gap-2 text-foreground"
          >
            <CursorBrandMark size="sm" />
            <span className="truncate text-[13px] font-medium">Chloei Code</span>
          </Link>
        </div>

        <div className="px-2 pb-2">
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            className="h-8 w-full justify-start border-border/60 bg-transparent text-[13px] font-normal shadow-none hover:bg-sidebar-accent"
            render={<Link href="/runs/new" />}
          >
            <PlusIcon className="size-3.5 opacity-70" />
            New agent
          </Button>
        </div>

        <SidebarRecentRuns runs={sidebarRuns} />

        <div className="shrink-0 space-y-1 border-t border-sidebar-border p-2">
          <Link
            href="/status"
            className={cn(
              "cursor-sidebar-item text-muted-foreground",
              "hover:bg-sidebar-accent/50 hover:text-foreground"
            )}
          >
            <ActivityIcon className="size-3.5 opacity-70" />
            Status
          </Link>
          <UserMenu user={user} menuItems={<SignOutMenuItem />} />
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <div className="cursor-content px-5 py-6 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
