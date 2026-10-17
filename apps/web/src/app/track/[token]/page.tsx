import * as React from "react";
import Link from "next/link";
import { getTrackingDetails } from "@/lib/tracking/queries";
import { PublicTracker } from "@/features/tracking/public-tracker";
import { IconArrowLeft, IconAlertCircle, IconStethoscope } from "@tabler/icons-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function TrackAppointmentPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Top minimal public navigation - Prerendered statically */}
      <header className="border-b border-border/80 bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-serif font-bold text-xl tracking-tight text-foreground hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <IconStethoscope className="h-5 w-5" />
            </div>
            <span>ClinicQ</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconArrowLeft className="h-4 w-4" />
            <span>Clinic Home</span>
          </Link>
        </div>
      </header>

      {/* Main tracker body - Dynamically streamed via PPR */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full flex-1 flex flex-col justify-center">
        <React.Suspense fallback={<TrackerSkeleton />}>
          <TrackerContent params={params} />
        </React.Suspense>
      </main>

      {/* Footer - Prerendered statically */}
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        <p>© 2026 ClinicQ Healthcare Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

async function TrackerContent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const details = await getTrackingDetails(token);

  if (!details) {
    return (
      <div className="w-full max-w-md mx-auto text-center p-8 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <IconAlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-foreground">
          Invalid or Expired Tracking Link
        </h2>
        <p className="text-sm text-muted-foreground">
          We could not find an active appointment matching this link. The token may be incorrect or the consultation may have been archived.
        </p>
        <div className="pt-2">
          <Link
            href="/book"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Book a New Appointment
          </Link>
        </div>
      </div>
    );
  }

  return <PublicTracker token={token} initialData={details} />;
}

function TrackerSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="rounded-2xl border border-border bg-card p-6 h-56"></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 h-28"></div>
        <div className="rounded-2xl border border-border bg-card p-5 h-28"></div>
        <div className="rounded-2xl border border-border bg-card p-5 h-28"></div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 h-48"></div>
    </div>
  );
}
