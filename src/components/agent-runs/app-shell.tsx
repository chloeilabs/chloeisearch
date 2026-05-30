import { AgentsAppChrome } from "@/components/agent-runs/agents-app-chrome";
import { AppSidebar } from "@/components/agent-runs/app-sidebar";
import { listRunsForUser } from "@/lib/agent-runs/repository";
import type { CurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export async function AppShell({
  user,
  children,
  contentClassName,
  headerActions,
}: {
  user: CurrentUser;
  children: React.ReactNode;
  contentClassName?: string;
  headerActions?: React.ReactNode;
}) {
  const sidebarRuns = (await listRunsForUser(user.id)).slice(0, 50);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <AgentsAppChrome
        sidebar={<AppSidebar user={user} runs={sidebarRuns} />}
        headerActions={headerActions}
        className={cn("px-4 py-4 lg:px-6 lg:py-5", contentClassName)}
      >
        {children}
      </AgentsAppChrome>
    </div>
  );
}
