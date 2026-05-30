import { LogOutIcon } from "lucide-react";

import { signOut } from "../../../auth";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function SignOutMenuItem() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/runs" });
      }}
    >
      <DropdownMenuItem
        nativeButton
        render={<button type="submit" className="w-full cursor-default" />}
      >
        <LogOutIcon data-icon="inline-start" />
        Sign out
      </DropdownMenuItem>
    </form>
  );
}
