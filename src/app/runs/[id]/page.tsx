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
    <AppShell user={user} contentClassName="px-4 py-0 lg:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <AgentRunHeader run={run} />
        <div className="grid xl:grid-cols-[minmax(0,1fr)_260px] xl:gap-8">
          <div className="min-w-0 border-border/50 xl:border-r xl:pr-8">
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
          <aside className="min-w-0 pt-6 xl:pt-0">
            <AgentRunMetadataPanel run={run} />
            <AgentRunArtifactsPanel runId={run.id} artifacts={run.artifacts} />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
