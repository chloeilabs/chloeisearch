import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PRLinkButton({ prUrl }: { prUrl?: string | null }) {
  if (!prUrl) {
    return null;
  }

  return (
    <Button
      nativeButton={false}
      render={<a href={prUrl} target="_blank" rel="noreferrer" />}
    >
      <ExternalLinkIcon data-icon="inline-start" />
      Open PR
    </Button>
  );
}
