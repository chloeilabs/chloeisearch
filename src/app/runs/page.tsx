import { AgentRunFilters } from "@/components/agent-runs/agent-run-filters";
import { FilteredRunsView } from "@/components/agent-runs/filtered-runs-view";
import { AppShell } from "@/components/agent-runs/app-shell";
import { NewAgentRunButton } from "@/components/agent-runs/new-agent-run-button";
import { RefreshButton } from "@/components/agent-runs/refresh-button";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { listRunsForUser } from "@/lib/agent-runs/repository";
import { runStatusFilters } from "@/lib/agent-runs/types";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return <SignInPanel />;
  }

  const { status } = await searchParams;
  const activeStatus = runStatusFilters.find((item) => item === status);
  const runs = await listRunsForUser(user.id, activeStatus);

  return (
    <AppShell user={user}>
      <main className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Agent runs</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Create, monitor, cancel, retry, and review Cursor cloud coding
              runs across connected GitHub repositories.
            </p>
          </div>
          <div className="flex gap-2">
            <RefreshButton />
            <NewAgentRunButton />
          </div>
        </div>
        <AgentRunFilters activeStatus={activeStatus} />
        <FilteredRunsView runs={runs} />
      </main>
    </AppShell>
  );
}
