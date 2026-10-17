import * as React from "react";
import type { Metadata } from "next";
import { getClinicQueueOverview, getDoctorQueueDetails } from "@/lib/queue/queries";
import { LiveQueueBoard } from "@/features/queue/live-queue-board";

export const metadata: Metadata = {
  title: "Live Queue Board — ClinicQ",
  description: "Real-time clinic queue management, patient arrivals, and doctor room allocations.",
};

export default async function QueuePage() {
  const summaries = await getClinicQueueOverview();
  const firstDoctorId = summaries[0]?.doctorId;
  const initialDoctorDetails = firstDoctorId
    ? await getDoctorQueueDetails(firstDoctorId)
    : null;

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-6">
      <LiveQueueBoard
        initialSummaries={summaries}
        initialSelectedDoctorDetails={initialDoctorDetails}
      />
    </div>
  );
}
