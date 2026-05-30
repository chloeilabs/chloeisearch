"use client";

import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RefreshButton({
  label = "Refresh",
  iconOnly = false,
}: {
  label?: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();

  if (iconOnly) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Refresh page"
        onClick={() => router.refresh()}
      >
        <RefreshCwIcon className="size-4" />
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={() => router.refresh()}>
      <RefreshCwIcon data-icon="inline-start" />
      {label}
    </Button>
  );
}
