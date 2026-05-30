import Link from "next/link";
import { BotIcon } from "lucide-react";

import { AppNavLinks } from "@/components/agent-runs/app-nav-links";
import { UserMenu } from "@/components/agent-runs/user-menu";
import { SignOutMenuItem } from "@/components/auth/sign-out-menu-item";
import type { CurrentUser } from "@/lib/auth";

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--control-canvas)]">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/runs" className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
                <BotIcon className="size-4.5 text-primary" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold tracking-tight">
                  Chloei Code
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  Cursor run control plane
                </span>
              </span>
            </Link>
            <UserMenu user={user} menuItems={<SignOutMenuItem />} />
          </div>
          <AppNavLinks />
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
