import { AlertCircleIcon, BotIcon } from "lucide-react";

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
    <main className="mx-auto flex min-h-[80vh] w-full max-w-lg items-center px-6 py-12">
      <Card className="w-full shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl border bg-muted/50">
            <BotIcon className="size-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Chloei Code</CardTitle>
          <CardDescription className="text-balance">
            Sign in to create, monitor, and review Cursor cloud agent runs on
            your GitHub repositories.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {hasProvider ? (
            <>
              <SignInButton />
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  GitHub OAuth
                </span>
                <Separator className="flex-1" />
              </div>
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                Requests repository access so runs can target your repos. Your
                token never leaves the server.
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
    </main>
  );
}
