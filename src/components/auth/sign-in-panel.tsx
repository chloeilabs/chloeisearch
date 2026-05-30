import { AlertCircleIcon } from "lucide-react";

import { SignInButton } from "@/components/auth/auth-buttons";
import { CursorBrandMark } from "@/components/brand/cursor-brand-mark";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export function SignInPanel() {
  const hasProvider = Boolean(
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--control-canvas)] px-6 py-12">
      <div className="mb-10 flex flex-col items-center text-center">
        <CursorBrandMark size="lg" className="mb-5" />
        <h1 className="text-lg font-medium tracking-tight text-foreground">
          Sign in to continue
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Connect GitHub to list repositories and launch cloud agents.
        </p>
      </div>

      <div className="cursor-panel w-full max-w-md p-6">
        {hasProvider ? (
          <div className="flex flex-col gap-4">
            <SignInButton />
            <div className="flex items-center gap-3">
              <Separator className="flex-1 opacity-40" />
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                OAuth
              </span>
              <Separator className="flex-1 opacity-40" />
            </div>
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Scopes include repository access for the run picker. Tokens stay on
              the server.
            </p>
          </div>
        ) : (
          <Alert>
            <AlertCircleIcon data-icon="inline-start" />
            <AlertTitle>Authentication is not configured</AlertTitle>
            <AlertDescription>
              Set GitHub OAuth variables or enable the documented local dev
              bypass.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
