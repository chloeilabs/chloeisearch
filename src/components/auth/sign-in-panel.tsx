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
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <div className="flex shrink-0 flex-col justify-between bg-zinc-950 px-6 py-8 text-white md:w-[min(28rem,45%)] md:px-12 md:py-10 lg:w-1/2">
        <div className="flex items-center gap-3">
          <CursorBrandMark size="md" className="text-white/90" />
          <span className="text-lg font-semibold tracking-tight text-white/90">
            Chloei Code
          </span>
        </div>
        <div className="mt-10 md:mt-0">
          <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
            Launch and monitor Cursor cloud agents across your GitHub
            repositories from one control plane.
          </p>
          <ul className="mt-6 hidden space-y-2 text-sm text-zinc-600 md:block">
            <li>Pick a repo and branch, then describe the task</li>
            <li>Track runs, artifacts, and pull requests in real time</li>
            <li>Retry, cancel, and refresh without leaving the app</li>
          </ul>
        </div>
        <p className="mt-8 text-xs text-zinc-600 md:mt-0">
          Inspired by the Cursor cloud agent workflow
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-10 md:py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 md:hidden">
            <h1 className="text-xl font-semibold tracking-tight">
              Sign in to continue
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect GitHub to list repositories and launch cloud agents.
            </p>
          </div>

          <div className="hidden md:block">
            <h1 className="text-2xl font-semibold tracking-tight">
              Get started
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect GitHub to list repositories and launch cloud agents.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
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
                  Scopes include repository access for the run picker. Tokens
                  stay on the server.
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
      </div>
    </div>
  );
}
