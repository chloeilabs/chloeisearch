import Link from "next/link";
import { BotIcon, PlusIcon } from "lucide-react";

import { AppNavLinks } from "@/components/agent-runs/app-nav-links";
import { UserMenu } from "@/components/agent-runs/user-menu";
import { SignOutMenuItem } from "@/components/auth/sign-out-menu-item";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/lib/auth";

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--control-canvas)]">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="border-b border-sidebar-border px-4 py-4">
          <Link href="/runs" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md border border-border/60 bg-card">
              <BotIcon className="size-4 text-foreground" />
            </span>
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

        <div className="mt-auto border-t border-sidebar-border p-3">
          <Button
            nativeButton={false}
            className="mb-3 w-full justify-center"
            render={<Link href="/runs/new" />}
          >
            <PlusIcon data-icon="inline-start" />
            New agent
          </Button>
          <UserMenu user={user} menuItems={<SignOutMenuItem />} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-auto px-6 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
