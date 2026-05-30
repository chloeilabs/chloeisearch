"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { PanelLeftIcon } from "lucide-react";

import { AgentsShellProvider } from "@/components/agent-runs/agents-shell-context";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { agentsSidebarSearchInputId } from "@/lib/agent-runs/sidebar-search";
import { cn } from "@/lib/utils";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function AgentsAppChrome({
  sidebar,
  children,
  headerStart,
  headerActions,
  className,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  headerStart?: ReactNode;
  headerActions?: ReactNode;
  className?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const focusSidebarSearch = useCallback(() => {
    setMobileOpen(true);
    requestAnimationFrame(() => {
      const input = document.getElementById(agentsSidebarSearchInputId);
      if (input instanceof HTMLInputElement) {
        input.focus();
        input.select();
      }
    });
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusSidebarSearch();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusSidebarSearch]);

  return (
    <AgentsShellProvider
      closeMobileSidebar={() => setMobileOpen(false)}
      focusSidebarSearch={focusSidebarSearch}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[min(20rem,88vw)] flex-col border-r border-border bg-muted/20 transition-transform duration-200 lg:static lg:z-0 lg:w-80 lg:translate-x-0 lg:shrink-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <TooltipProvider delay={0}>{sidebar}</TooltipProvider>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 lg:px-4 lg:py-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
            >
              <PanelLeftIcon className="size-4" />
            </Button>
            {headerStart ? (
              <div className="min-w-0 flex-1 overflow-hidden">{headerStart}</div>
            ) : (
              <div className="min-w-0 flex-1" />
            )}
            {headerActions ? (
              <div className="flex shrink-0 items-center gap-1">{headerActions}</div>
            ) : null}
          </header>
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-fade",
              className
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </AgentsShellProvider>
  );
}
