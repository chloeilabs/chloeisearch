import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { AppNavLinks } from "@/components/agent-runs/app-nav-links";
import { SidebarRecentRuns } from "@/components/agent-runs/sidebar-recent-runs";
import { UserMenu } from "@/components/agent-runs/user-menu";
import { SignOutMenuItem } from "@/components/auth/sign-out-menu-item";
import { CursorBrandMark } from "@/components/brand/cursor-brand-mark";
import { Button } from "@/components/ui/button";
import { listRunsForUser } from "@/lib/agent-runs/repository";
import type { CurrentUser } from "@/lib/auth";

export async function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const recentRuns = (await listRunsForUser(user.id)).slice(0, 8);

  return (
    <div className="flex min-h-screen bg-[var(--control-canvas)]">
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="border-b border-sidebar-border px-3 py-3.5">
          <Link href="/runs" className="flex items-center gap-2.5">
            <CursorBrandMark size="sm" />
            <span className="min-w-0 leading-tight">
              <span className="block text-sm font-medium text-foreground">
                Chloei Code
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Cloud agents
              </span>
            </span>
          </Link>
        </div>

        <AppNavLinks layout="sidebar" />
        <SidebarRecentRuns runs={recentRuns} />

        <div className="mt-auto shrink-0 border-t border-sidebar-border p-3">
          <Button
            nativeButton={false}
            className="mb-3 w-full justify-center shadow-sm"
            render={<Link href="/runs/new" />}
          >
            <PlusIcon data-icon="inline-start" />
            New agent
          </Button>
          <UserMenu user={user} menuItems={<SignOutMenuItem />} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="cursor-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
