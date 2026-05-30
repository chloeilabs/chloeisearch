import { AppShell } from "@/components/agent-runs/app-shell";
import { NewAgentRunForm } from "@/components/agent-runs/new-agent-run-form";
import { NewRunBreadcrumbs } from "@/components/agent-runs/run-breadcrumbs";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { PageHeader } from "@/components/ui/page-header";
import { getRunCreationLimits } from "@/lib/agent-runs/limits";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewRunPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <SignInPanel />;
  }

  const runLimits = await getRunCreationLimits(user.id);

  return (
    <AppShell user={user}>
      <main className="flex flex-col gap-6">
        <div className="space-y-3">
          <NewRunBreadcrumbs />
          <PageHeader
            title="New cloud run"
            description="Send a repository-scoped coding task to Cursor cloud runtime. The Cursor API key stays server-side."
          />
        </div>
        <NewAgentRunForm runLimits={runLimits} />
      </main>
    </AppShell>
  );
}
