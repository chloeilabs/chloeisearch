import Link from "next/link";
import { PlusIcon, SettingsIcon } from "lucide-react";

import { SidebarRecentRuns } from "@/components/agent-runs/sidebar-recent-runs";
import { SidebarStatusLink } from "@/components/agent-runs/sidebar-status-link";
import { UserMenu } from "@/components/agent-runs/user-menu";
import { SignOutMenuItem } from "@/components/auth/sign-out-menu-item";
import { Button } from "@/components/ui/button";
import type { AgentRun } from "@prisma/client";
import type { CurrentUser } from "@/lib/auth";

export function AppSidebar({
  user,
  runs,
}: {
  user: CurrentUser;
  runs: AgentRun[];
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-3">
        <Link
          href="/runs"
          className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-foreground"
        >
          Chloei Code
        </Link>
        <Button
          nativeButton={false}
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground"
          render={<Link href="/status" />}
          aria-label="Status"
        >
          <SettingsIcon className="size-4" />
        </Button>
      </div>

      <div className="p-2">
        <Button
          nativeButton={false}
          className="h-9 w-full justify-start gap-2 shadow-none"
          render={<Link href="/runs/new" />}
        >
          <PlusIcon className="size-4" />
          New agent
        </Button>
      </div>

      <SidebarRecentRuns runs={runs} />

      <div className="mt-auto shrink-0 space-y-1 border-t border-border p-2">
        <SidebarStatusLink />
        <UserMenu user={user} menuItems={<SignOutMenuItem />} />
      </div>
    </div>
  );
}
