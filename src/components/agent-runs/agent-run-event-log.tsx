"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CableIcon, ChevronDownIcon, UnplugIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateTime } from "@/lib/format";
import { isTerminalStatus } from "@/lib/cursor/status";
import { cn } from "@/lib/utils";

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
        <CardTitle className="text-base">Agent stream</CardTitle>
        <Badge
          variant="outline"
          className={cn(
            connected &&
              "border-[var(--status-running-border)] bg-[var(--status-running-bg)] text-[var(--status-running-fg)]"
          )}
        >
          {connected ? (
            <CableIcon data-icon="inline-start" className="animate-pulse" />
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
          <ScrollArea className="max-h-[min(70vh,640px)] rounded-md bg-muted/15 pr-3">
            <ol className="relative flex flex-col gap-4 border-l border-border/80 pl-4">
              {orderedEvents.map((event) => (
                <li key={event.id} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[21px] top-2 size-2.5 rounded-full ring-2 ring-card",
                      eventTypeDotClass(event.eventType)
                    )}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="tabular-nums">
                      #{event.sequenceNumber}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[0.65rem]">
                      {event.eventType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(event.createdAt)}
                    </span>
                  </div>
                  {event.messageText ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                      {event.messageText}
                    </p>
                  ) : null}
                  <Collapsible className="mt-2">
                    <CollapsibleTrigger className="flex items-center gap-1 rounded-md px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                      <ChevronDownIcon className="size-3.5 transition-transform in-data-open:rotate-180" />
                      Raw JSON
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="cursor-log-surface mt-2 max-h-56 overflow-auto">
                        {JSON.stringify(event.rawPayload, null, 2)}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function eventTypeDotClass(eventType: string) {
  switch (eventType) {
    case "assistant":
      return "bg-primary";
    case "thinking":
      return "bg-chart-5";
    case "tool_call":
      return "bg-chart-3";
    case "status":
      return "bg-chart-2";
    case "error":
    case "app.stream_error":
      return "bg-destructive";
    default:
      return "bg-muted-foreground";
  }
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
