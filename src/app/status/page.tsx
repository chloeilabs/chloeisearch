import type { ReactNode } from "react";

import {
  ActivityIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  CircleSlashIcon,
} from "lucide-react";

import { AppShell } from "@/components/agent-runs/app-shell";
import { StatusBreadcrumbs } from "@/components/agent-runs/status-breadcrumbs";
import { RefreshButton } from "@/components/agent-runs/refresh-button";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { Badge } from "@/components/ui/badge";
import { getRunCreationLimits } from "@/lib/agent-runs/limits";
import {
  getRunHealthStats,
  getRunOperationsActivity,
} from "@/lib/agent-runs/repository";
import { getCurrentUser } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { getDeepHealth, type HealthCheck } from "@/lib/health/checks";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <SignInPanel />;
  }

  const env = getEnv();
  const [health, runStats, runLimits, operationsActivity] = await Promise.all([
    getDeepHealth(user.id),
    getRunHealthStats(user.id, env.STALE_ACTIVE_RUN_MINUTES),
    getRunCreationLimits(user.id),
    getRunOperationsActivity(user.id),
  ]);

  return (
    <AppShell user={user} headerStart={<StatusBreadcrumbs />} headerActions={<RefreshButton iconOnly />}>
      <div className="mx-auto w-full max-w-3xl flex flex-col gap-5">
        <p className="text-sm text-muted-foreground">
          Runtime checks for the control plane, external APIs, and active
          Cursor runs (excluding archived).
        </p>

        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Metric label="Total runs" value={runStats.totalRuns} />
          <Metric label="Active runs" value={runStats.activeRuns} />
          <Metric label="Failed runs" value={runStats.failedRuns} />
          <Metric label="Stale active" value={runStats.staleActiveRuns} />
          <Metric
            label="Active capacity"
            value={formatLimitMetric(
              runLimits.activeRuns,
              runLimits.activeLimit
            )}
          />
          <Metric
            label="24h runs"
            value={formatLimitMetric(
              runLimits.runsLast24Hours,
              runLimits.dailyLimit
            )}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <StatusPanel title="Runtime configuration">
            <dl className="grid gap-3 sm:grid-cols-2">
              <ConfigMetric
                label="Default model"
                value={env.DEFAULT_CURSOR_MODEL || "Cursor account default"}
              />
              <ConfigMetric
                label="Git hosts"
                value={env.ALLOWED_GIT_HOSTS.join(", ")}
              />
              <ConfigMetric
                label="GitHub orgs"
                value={
                  env.ALLOWED_GITHUB_ORGS.length > 0
                    ? `${env.ALLOWED_GITHUB_ORGS.length} configured`
                    : "Any repository you can access"
                }
              />
              <ConfigMetric
                label="Sign-in allowlist"
                value={`${env.ALLOWED_GITHUB_USERS.length} GitHub user(s), ${env.ALLOWED_EMAILS.length} email(s)`}
              />
              <ConfigMetric
                label="Create/cancel/retry rate"
                value={`${env.AGENT_RUN_RATE_LIMIT} / user / minute`}
              />
              <ConfigMetric
                label="Cron batch size"
                value={`${env.CRON_REFRESH_BATCH_SIZE} active run(s)`}
              />
            </dl>
          </StatusPanel>

          <StatusPanel title="Refresh activity">
            <dl className="grid gap-3 sm:grid-cols-2">
              <ConfigMetric
                label="Cron schedule"
                value="Every 5 minutes in production"
              />
              <ConfigMetric
                label="Last cron refresh"
                value={
                  operationsActivity.latestCronEvent
                    ? formatDateTime(operationsActivity.latestCronEvent.createdAt)
                    : "No active-run cron event yet"
                }
              />
              <ConfigMetric
                label="Latest run update"
                value={
                  runStats.latestRunRefresh
                    ? formatDateTime(runStats.latestRunRefresh.updatedAt)
                    : "No Cursor run updates yet"
                }
              />
              <ConfigMetric
                label="Latest event"
                value={
                  operationsActivity.latestRunEvent
                    ? operationsActivity.latestRunEvent.eventType
                    : "No events yet"
                }
              />
            </dl>
          </StatusPanel>
        </section>

        <StatusPanel
          title={
            <span className="flex items-center gap-2">
              <ActivityIcon className="size-4 opacity-70" />
              Service checks
            </span>
          }
          action={<HealthBadge status={health.status} />}
          bodyClassName="divide-y divide-border/50 p-0"
        >
          {health.checks.map((check) => (
            <HealthRow key={check.name} check={check} />
          ))}
        </StatusPanel>
      </div>
    </AppShell>
  );
}

function StatusPanel({
  title,
  action,
  children,
  bodyClassName = "p-4",
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className="cursor-panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-border/50 bg-card/20 px-4 py-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-medium tabular-nums">{value}</p>
    </div>
  );
}

function ConfigMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm text-foreground/90">{value}</dd>
    </div>
  );
}

function HealthRow({ check }: { check: HealthCheck }) {
  const Icon =
    check.status === "ok"
      ? CheckCircle2Icon
      : check.status === "skipped"
        ? CircleSlashIcon
        : CircleAlertIcon;

  return (
    <div className="grid gap-3 px-4 py-3.5 md:grid-cols-[220px_1fr_auto] md:items-center">
      <div className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 opacity-80" />
        <span className="text-sm font-medium">
          {check.name.replaceAll("_", " ")}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{check.message}</p>
      <div className="flex items-center gap-2">
        <HealthBadge status={check.status} />
        {typeof check.latencyMs === "number" ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            {check.latencyMs}ms
          </span>
        ) : null}
      </div>
    </div>
  );
}

function HealthBadge({ status }: { status: HealthCheck["status"] }) {
  const variant =
    status === "ok" ? "default" : status === "degraded" ? "secondary" : "destructive";

  return <Badge variant={variant}>{status}</Badge>;
}

function formatLimitMetric(count: number, limit: number | null) {
  return limit === null ? `${count} / off` : `${count} / ${limit}`;
}
