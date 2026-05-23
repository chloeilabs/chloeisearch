import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export function NewAgentRunButton() {
  return (
    <Link href="/runs/new" className={buttonVariants()}>
      <PlusIcon data-icon="inline-start" />
      New run
    </Link>
  );
}
