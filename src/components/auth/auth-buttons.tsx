import { LogInIcon, LogOutIcon } from "lucide-react";

import { signIn, signOut } from "../../../auth";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github", { redirectTo: "/runs" });
      }}
    >
      <Button type="submit" className="w-full" size="lg">
        <LogInIcon data-icon="inline-start" />
        Sign in with GitHub
      </Button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/runs" });
      }}
    >
      <Button type="submit" variant="outline" size="sm">
        <LogOutIcon data-icon="inline-start" />
        Sign out
      </Button>
    </form>
  );
}
