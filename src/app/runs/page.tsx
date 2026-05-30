import { AgentRunFilters } from "@/components/agent-runs/agent-run-filters";
import { AgentRunsTable } from "@/components/agent-runs/agent-runs-table";
import { AppShell } from "@/components/agent-runs/app-shell";
import { NewAgentRunButton } from "@/components/agent-runs/new-agent-run-button";
import { RefreshButton } from "@/components/agent-runs/refresh-button";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { PageHeader } from "@/components/ui/page-header";
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
      <main className="flex flex-col gap-6">
        <PageHeader
          title="Agent runs"
          description="Create, monitor, cancel, retry, and review Cursor cloud coding runs across connected GitHub repositories."
          actions={
            <>
              <RefreshButton />
              <NewAgentRunButton />
            </>
          }
        />
        <AgentRunFilters activeStatus={activeStatus} />
        <AgentRunsTable runs={runs} />
      </main>
    </AppShell>
  );
}
