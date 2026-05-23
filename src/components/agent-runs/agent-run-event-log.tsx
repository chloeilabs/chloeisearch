"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CableIcon, UnplugIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { isTerminalStatus } from "@/lib/cursor/status";

export type EventLogItem = {
  id: string;
  sequenceNumber: number;
  eventType: string;
  messageText?: string | null;
  rawPayload: unknown;
  createdAt: Date | string;
};

export function AgentRunEventLog({
  runId,
  initialEvents,
  status,
}: {
  runId: string;
  initialEvents: EventLogItem[];
  status: string;
}) {
  const router = useRouter();
  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [connected, setConnected] = useState(false);
  const didRequestFinalRefresh = useRef(false);
  const shouldStream = !isTerminalStatus(status);

  useEffect(() => {
    if (!shouldStream) {
      return;
    }

    const source = new EventSource(`/api/agent-runs/${runId}/stream`);
    const finalizeFromTerminalEvent = async () => {
      if (didRequestFinalRefresh.current) {
        return;
      }

      didRequestFinalRefresh.current = true;
      setConnected(false);
      source.close();

      await fetch(`/api/agent-runs/${runId}/refresh`, {
        method: "POST",
        cache: "no-store",
      }).catch(() => undefined);

      router.refresh();
    };

    source.addEventListener("connected", () => setConnected(true));
    source.addEventListener("cursor-event", (event) => {
      const item = JSON.parse(event.data) as EventLogItem;
      setEvents((current) => mergeEvents(current, [item]));

      if (isTerminalCursorStatusEvent(item)) {
        void finalizeFromTerminalEvent();
      }
    });
    source.addEventListener("done", () => {
      setConnected(false);
      source.close();
      router.refresh();
    });
    source.addEventListener("error", () => {
      setConnected(false);
    });

    return () => {
      setConnected(false);
      source.close();
    };
  }, [router, runId, shouldStream]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/agent-runs/${runId}/events`, {
        cache: "no-store",
      });

      if (response.ok) {
        const payload = (await response.json()) as { events: EventLogItem[] };
        setEvents((current) => mergeEvents(current, payload.events));
      }
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [runId]);

  const orderedEvents = useMemo(
    () => mergeEvents(initialEvents, events),
    [events, initialEvents]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Event log</CardTitle>
        <Badge variant="outline">
          {connected ? (
            <CableIcon data-icon="inline-start" />
          ) : (
            <UnplugIcon data-icon="inline-start" />
          )}
          {connected ? "Streaming" : "Refreshable"}
        </Badge>
      </CardHeader>
      <CardContent>
        {orderedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No events have been persisted yet.
          </p>
        ) : (
          <ol className="relative flex flex-col gap-3 border-l pl-4">
            {orderedEvents.map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-foreground" />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">#{event.sequenceNumber}</Badge>
                  <span className="font-mono text-xs">{event.eventType}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(event.createdAt)}
                  </span>
                </div>
                {event.messageText ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                    {event.messageText}
                  </p>
                ) : null}
                <details className="mt-2 rounded-lg bg-muted/50 p-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Raw event JSON
                  </summary>
                  <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap text-xs">
                    {JSON.stringify(event.rawPayload, null, 2)}
                  </pre>
                </details>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function mergeEvents(current: EventLogItem[], incoming: EventLogItem[]) {
  const byId = new Map(current.map((event) => [event.id, event]));

  for (const event of incoming) {
    byId.set(event.id, event);
  }

  return [...byId.values()].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

export function isTerminalCursorStatusEvent(event: EventLogItem) {
  if (event.eventType !== "status" || !isRecord(event.rawPayload)) {
    return false;
  }

  return isTerminalStatus(event.rawPayload.status);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
