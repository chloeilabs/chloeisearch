import { AppShell } from "@/components/agent-runs/app-shell";
import { NewAgentRunForm } from "@/components/agent-runs/new-agent-run-form";
import { NewRunBreadcrumbs } from "@/components/agent-runs/run-breadcrumbs";
import { SignInPanel } from "@/components/auth/sign-in-panel";
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
    <AppShell
      user={user}
      contentClassName="flex min-h-0 flex-1 flex-col py-2 lg:max-w-2xl"
      headerStart={<NewRunBreadcrumbs />}
    >
      <NewAgentRunForm runLimits={runLimits} layout="composer" />
    </AppShell>
  );
}
