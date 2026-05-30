"use client";

import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Refresh"
      onClick={() => router.refresh()}
    >
      <RefreshCwIcon className="size-4" />
    </Button>
  );
}
