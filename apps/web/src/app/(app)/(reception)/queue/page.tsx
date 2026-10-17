import * as React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import { getClinicQueueOverview, getDoctorQueueDetails } from "@/lib/queue/queries";
import { LiveQueueBoard } from "@/features/queue/live-queue-board";

export const metadata: Metadata = {
  title: "Live Queue Board — ClinicQ",
  description: "Real-time clinic queue management, patient arrivals, and doctor room allocations.",
};

function QueueSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-6 sm:p-8 space-y-6">
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

async function QueueContent() {
  const [user, summaries] = await Promise.all([
    getSessionUser(),
    getClinicQueueOverview(),
  ]);

  const firstDoctorId = summaries[0]?.doctorId;
  const initialDoctorDetails = firstDoctorId
    ? await getDoctorQueueDetails(firstDoctorId)
    : null;

  return (
    <AppShell user={user}>
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-6">
        <LiveQueueBoard
          initialSummaries={summaries}
          initialSelectedDoctorDetails={initialDoctorDetails}
        />
      </div>
    </AppShell>
  );
}

export default function QueuePage() {
  return (
    <React.Suspense fallback={<QueueSkeleton />}>
      <QueueContent />
    </React.Suspense>
  );
}
