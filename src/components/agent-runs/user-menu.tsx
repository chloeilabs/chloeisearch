"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

function initials(user: CurrentUser) {
  const source = user.name ?? user.email ?? user.id;
  const parts = source.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function UserMenu({
  user,
  menuItems,
  className,
}: {
  user: CurrentUser;
  menuItems: React.ReactNode;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-auto w-full justify-start gap-2 rounded-md px-2 py-2 hover:bg-sidebar-accent",
              className
            )}
            aria-label="Account menu"
          />
        }
      >
        <Avatar size="sm">
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback className="bg-secondary text-xs font-medium">
            {initials(user)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate text-left text-xs font-normal text-sidebar-foreground">
          {user.email ?? user.name ?? "Account"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium leading-none">
            {user.name ?? "Signed in"}
          </p>
          {user.email ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuItems}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
