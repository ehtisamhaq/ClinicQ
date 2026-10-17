import type { Metadata } from "next";
import Link from "next/link";
import { IconClockPlay, IconHeartbeat } from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrackLookupForm } from "@/features/tracking/track-lookup-form";

export const metadata: Metadata = {
  title: "Track Queue Turn — ClinicQ",
  description: "Track your real-time queue position and estimated wait time.",
};

export default function TrackLookupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Top minimal public navigation */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <IconHeartbeat className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                Clinic<span className="text-primary font-normal">Q</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground -mt-1">
                Dhaka Central
              </span>
            </div>
          </Link>

          <Link
            href="/assistant"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Assistant
          </Link>
        </div>
      </header>

      {/* Main Form Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md border-border/60 shadow-lg backdrop-blur-md bg-card/90">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <IconClockPlay className="h-6 w-6" />
            </div>
            <CardTitle className="font-heading text-2xl font-bold tracking-tight">
              Track Queue Turn
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Enter the unique tracking token provided in your booking confirmation or SMS to see your live queue position and estimated wait time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrackLookupForm />
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border/50 py-4 text-center text-xs text-muted-foreground">
        © 2026 ClinicQ Healthcare Platform. Honest wait estimates powered by real consultation duration analytics.
      </footer>
    </div>
  );
}
