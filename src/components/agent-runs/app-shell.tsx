import Link from "next/link";
import { BotIcon, PlusIcon } from "lucide-react";

import type { CurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/auth-buttons";
import { buttonVariants } from "@/components/ui/button";

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--control-canvas)]">
      <header className="border-b bg-background/95">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/runs" className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg border bg-card">
              <BotIcon />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                Cloud Coding Agents
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Cursor run control plane
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/runs/new"
              className={buttonVariants({ size: "sm" })}
            >
              <PlusIcon data-icon="inline-start" />
              New run
            </Link>
            <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground sm:block">
              {user.email ?? user.name ?? user.id}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {children}
      </div>
    </div>
  );
}
