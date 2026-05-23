import { AlertCircleIcon } from "lucide-react";

import { SignInButton } from "@/components/auth/auth-buttons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SignInPanel() {
  const hasProvider = Boolean(
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
  );

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Chloei Code</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Sign in to create and monitor Cursor cloud agent runs.
          </p>
          {hasProvider ? (
            <SignInButton />
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
