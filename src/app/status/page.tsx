import {
  ActivityIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  CircleSlashIcon,
} from "lucide-react";

import { AppShell } from "@/components/agent-runs/app-shell";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRunCreationLimits } from "@/lib/agent-runs/limits";
import { getRunHealthStats } from "@/lib/agent-runs/repository";
import { getCurrentUser } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { getDeepHealth, type HealthCheck } from "@/lib/health/checks";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <SignInPanel />;
  }

  const env = getEnv();
  const [health, runStats, runLimits] = await Promise.all([
    getDeepHealth(user.id),
    getRunHealthStats(user.id, env.STALE_ACTIVE_RUN_MINUTES),
    getRunCreationLimits(user.id),
  ]);

  return (
    <AppShell user={user}>
      <main className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold">Production status</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Runtime checks for the control plane, external APIs, and active
            Cursor runs.
          </p>
        </div>

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ActivityIcon className="size-4" />
              Service checks
            </CardTitle>
            <HealthBadge status={health.status} />
          </CardHeader>
          <CardContent className="divide-y p-0">
            {health.checks.map((check) => (
              <HealthRow key={check.name} check={check} />
            ))}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
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
    <div className="grid gap-3 p-4 md:grid-cols-[220px_1fr_auto] md:items-center">
      <div className="flex items-center gap-2">
        <Icon className="size-4" />
        <span className="font-medium">{check.name.replaceAll("_", " ")}</span>
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
