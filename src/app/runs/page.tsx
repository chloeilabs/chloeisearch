import { AgentRunFilters } from "@/components/agent-runs/agent-run-filters";
import { AgentsHome } from "@/components/agent-runs/agents-home";
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
  const allRuns = await listRunsForUser(user.id);
  const runs = activeStatus
    ? allRuns.filter((run) => run.normalizedStatus === activeStatus)
    : allRuns;

  if (!activeStatus) {
    return (
      <AppShell user={user}>
        <AgentsHome runs={allRuns} />
      </AppShell>
    );
  }

  return (
    <AppShell
      user={user}
      headerActions={
        <>
          <RefreshButton />
          <NewAgentRunButton />
        </>
      }
    >
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="mb-1 text-lg font-medium tracking-tight">Agents</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Filtered by status. Select a run in the sidebar to open details.
        </p>
        <AgentRunFilters activeStatus={activeStatus} />
        <FilteredRunsView runs={runs} />
      </div>
    </AppShell>
  );
}
