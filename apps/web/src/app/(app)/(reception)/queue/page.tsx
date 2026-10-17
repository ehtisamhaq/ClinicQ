import * as React from "react";
import type { Metadata } from "next";
import { getClinicQueueOverview, getDoctorQueueDetails } from "@/lib/queue/queries";
import { LiveQueueBoard } from "@/features/queue/live-queue-board";

export const metadata: Metadata = {
  title: "Live Queue Board — ClinicQ",
  description: "Real-time clinic queue management, patient arrivals, and doctor room allocations.",
};

export default function QueuePage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-6">
      <React.Suspense fallback={<QueueLoadingSkeleton />}>
        <QueueContent />
      </React.Suspense>
    </div>
  );
}

async function QueueContent() {
  const summaries = await getClinicQueueOverview();
  const firstDoctorId = summaries[0]?.doctorId;
  const initialDoctorDetails = firstDoctorId
    ? await getDoctorQueueDetails(firstDoctorId)
    : null;

  return (
    <LiveQueueBoard
      initialSummaries={summaries}
      initialSelectedDoctorDetails={initialDoctorDetails}
    />
  );
}

function QueueLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-muted/60 rounded-xl" />
      <div className="h-64 bg-muted/40 rounded-2xl" />
    </div>
  );
}
