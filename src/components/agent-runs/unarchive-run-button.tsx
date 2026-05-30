"use client";

import { useRouter } from "next/navigation";
import { ArchiveRestoreIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { patchAgentRun } from "@/lib/agent-runs/client-patch";

export function UnarchiveRunButton({ runId }: { runId: string }) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      className="h-7 px-2 text-muted-foreground"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void (async () => {
          try {
            await patchAgentRun(runId, { archived: false });
            router.refresh();
          } catch (error) {
            console.error("Failed to unarchive agent run:", error);
          }
        })();
      }}
    >
      <ArchiveRestoreIcon className="size-3" data-icon="inline-start" />
      Unarchive
    </Button>
  );
}
