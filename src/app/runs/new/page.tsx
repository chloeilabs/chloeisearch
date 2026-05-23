import { AppShell } from "@/components/agent-runs/app-shell";
import { NewAgentRunForm } from "@/components/agent-runs/new-agent-run-form";
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
    <AppShell user={user}>
      <main className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold">New cloud run</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Send a repository-scoped coding task to Cursor cloud runtime. The
            Cursor API key stays server-side.
          </p>
        </div>
        <NewAgentRunForm runLimits={runLimits} />
      </main>
    </AppShell>
  );
}
