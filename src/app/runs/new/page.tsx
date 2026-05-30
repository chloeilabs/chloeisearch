import { AppShell } from "@/components/agent-runs/app-shell";
import { NewAgentRunForm } from "@/components/agent-runs/new-agent-run-form";
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
      <div className="flex flex-col gap-4">
        <PageHeader title="New agent" />
        <NewAgentRunForm runLimits={runLimits} />
      </div>
    </AppShell>
  );
}
