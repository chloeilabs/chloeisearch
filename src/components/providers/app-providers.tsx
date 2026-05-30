"use client";

import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster
        closeButton
        position="bottom-right"
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "cursor-panel border-border/80",
          },
        }}
      />
    </ThemeProvider>
  );
}
