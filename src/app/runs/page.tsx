import { AgentRunFilters } from "@/components/agent-runs/agent-run-filters";
import { AgentsHome } from "@/components/agent-runs/agents-home";
import { FilteredRunsView } from "@/components/agent-runs/filtered-runs-view";
import { AppShell } from "@/components/agent-runs/app-shell";
import { NewAgentRunButton } from "@/components/agent-runs/new-agent-run-button";
import { RefreshButton } from "@/components/agent-runs/refresh-button";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import {
  countArchivedRunsForUser,
  listRunsForUser,
} from "@/lib/agent-runs/repository";
import { runStatusFilters } from "@/lib/agent-runs/types";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; archived?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return <SignInPanel />;
  }

  const { status, archived } = await searchParams;
  const showArchived = archived === "1";
  const activeStatus = runStatusFilters.find((item) => item === status);
  const [allRuns, archivedCount] = await Promise.all([
    listRunsForUser(user.id, {
      archived: showArchived ? "archived" : "active",
    }),
    countArchivedRunsForUser(user.id),
  ]);
  const runs = activeStatus
    ? allRuns.filter((run) => run.normalizedStatus === activeStatus)
    : allRuns;

  if (showArchived && !activeStatus) {
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
          <h1 className="mb-1 text-lg font-medium tracking-tight">Archived</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Agents hidden from the sidebar. Open one to unarchive or review.
          </p>
          <AgentRunFilters showArchived />
          <FilteredRunsView runs={runs} showUnarchive />
        </div>
      </AppShell>
    );
  }

  if (!activeStatus) {
    return (
      <AppShell user={user}>
        <AgentsHome runs={allRuns} archivedCount={archivedCount} />
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
