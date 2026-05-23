"use client";

import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RefreshButton({ label = "Refresh" }: { label?: string }) {
  const router = useRouter();

  return (
    <Button variant="outline" onClick={() => router.refresh()}>
      <RefreshCwIcon data-icon="inline-start" />
      {label}
    </Button>
  );
}
