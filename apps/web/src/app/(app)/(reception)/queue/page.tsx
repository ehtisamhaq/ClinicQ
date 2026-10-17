import * as React from "react";
import type { Metadata } from "next";
import { getClinicQueueOverview, getDoctorQueueDetails } from "@/lib/queue/queries";
import { LiveQueueBoard } from "@/features/queue/live-queue-board";

import { getSessionUser } from "@/lib/auth/session";

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
  const [summaries, user] = await Promise.all([
    getClinicQueueOverview(),
    getSessionUser(),
  ]);

  // If logged in as DOCTOR, automatically default to their own consult room
  const myDoctorSummary = user?.role === "DOCTOR"
    ? summaries.find((s) => s.doctorEmail === user.email)
    : null;

  const targetDoctorId = myDoctorSummary?.doctorId || summaries[0]?.doctorId;
  const initialDoctorDetails = targetDoctorId
    ? await getDoctorQueueDetails(targetDoctorId)
    : null;

  return (
    <LiveQueueBoard
      initialSummaries={summaries}
      initialSelectedDoctorDetails={initialDoctorDetails}
      currentUser={user ? { id: user.id, email: user.email, role: user.role } : null}
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
