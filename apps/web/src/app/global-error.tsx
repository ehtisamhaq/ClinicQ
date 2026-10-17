"use client";

import * as React from "react";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground antialiased font-sans">
        <div className="mx-auto flex max-w-md flex-col items-center text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-sm">
            <IconAlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              An unexpected error occurred. You can attempt to reload the application state or return to safety.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button size="sm" onClick={() => reset()} className="gap-1.5">
              <IconRefresh className="h-4 w-4" />
              Try again
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => (window.location.href = "/")}
            >
              Go to Home
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
