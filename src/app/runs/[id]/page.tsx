import { notFound } from "next/navigation";

import { AgentRunArtifactsPanel } from "@/components/agent-runs/agent-run-artifacts-panel";
import { AgentRunEventLog } from "@/components/agent-runs/agent-run-event-log";
import { AgentRunHeader } from "@/components/agent-runs/agent-run-header";
import { AgentRunMetadataPanel } from "@/components/agent-runs/agent-run-metadata-panel";
import { AgentRunPromptPanel } from "@/components/agent-runs/agent-run-prompt-panel";
import { AgentRunPullRequestPanel } from "@/components/agent-runs/agent-run-pull-request-panel";
import { AgentRunResultPanel } from "@/components/agent-runs/agent-run-result-panel";
import { AppShell } from "@/components/agent-runs/app-shell";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { getRunPullRequestLifecycle } from "@/lib/agent-runs/pull-request-service";
import { getRunDetailForUser } from "@/lib/agent-runs/repository";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return <SignInPanel />;
  }

  const { id } = await params;
  const run = await getRunDetailForUser(user.id, id);

  if (!run) {
    notFound();
  }

  const pullRequestResult = run.prUrl
    ? await getRunPullRequestLifecycle(user.id, run.id)
        .then((pullRequest) => ({ pullRequest, error: null }))
        .catch((error) => ({
          pullRequest: null,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load pull request.",
        }))
    : { pullRequest: null, error: null };

  return (
    <AppShell user={user} contentClassName="max-w-4xl">
      <div className="flex flex-col gap-6">
        <AgentRunHeader run={run} />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="flex min-w-0 flex-col gap-5">
            <AgentRunEventLog
              runId={run.id}
              initialEvents={run.events}
              status={run.normalizedStatus}
            />
            <AgentRunResultPanel run={run} />
            <AgentRunPullRequestPanel
              runId={run.id}
              prUrl={run.prUrl}
              initialPullRequest={pullRequestResult.pullRequest}
              initialError={pullRequestResult.error}
            />
            <AgentRunPromptPanel prompt={run.taskPrompt} />
          </div>
          <aside className="flex min-w-0 flex-col gap-5">
            <AgentRunMetadataPanel run={run} />
            <AgentRunArtifactsPanel runId={run.id} artifacts={run.artifacts} />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
