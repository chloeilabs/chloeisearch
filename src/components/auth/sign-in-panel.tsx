import { AlertCircleIcon } from "lucide-react";

import { SignInButton } from "@/components/auth/auth-buttons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function SignInPanel() {
  const hasProvider = Boolean(
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--control-canvas)] px-6 py-12">
      <div className="mb-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Chloei Code
        </p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-foreground">
          Cloud agent control plane
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Same agents as Cursor — orchestrated for your repositories.
        </p>
      </div>

      <Card className="w-full max-w-md cursor-panel border-border/80 bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-lg font-medium">Sign in</CardTitle>
          <CardDescription>
            Connect GitHub to list repositories and launch cloud runs.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {hasProvider ? (
            <>
              <SignInButton />
              <div className="flex items-center gap-3">
                <Separator className="flex-1 opacity-40" />
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  OAuth
                </span>
                <Separator className="flex-1 opacity-40" />
              </div>
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                Scopes include repository access for the run picker. Tokens stay
                on the server.
              </p>
            </>
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
        </CardContent>
      </Card>
    </div>
  );
}
