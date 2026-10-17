"use client";

import * as React from "react";
import Link from "next/link";
import { IconAlertTriangle, IconRefresh, IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Route error caught by ErrorBoundary:", error);
  }, [error]);

  return (
    <div className="container max-w-lg mx-auto flex min-h-[50vh] flex-col items-center justify-center p-6">
      <Card className="w-full border-destructive/20 bg-card shadow-md">
        <CardContent className="flex flex-col items-center text-center p-6 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <IconAlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Unable to load page content
            </h2>
            <p className="text-xs text-muted-foreground">
              {error.message || "An unexpected error occurred while processing this request."}
            </p>
          </div>
          <div className="flex items-center gap-2.5 pt-2">
            <Button size="sm" onClick={() => reset()} className="gap-1.5 text-xs">
              <IconRefresh className="h-3.5 w-3.5" />
              Try again
            </Button>
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/" />}
              className="gap-1.5 text-xs"
            >
              <IconArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
