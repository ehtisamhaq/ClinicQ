import * as React from "react";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import {
  getMyDoctorProfile,
  getDoctorTodayAppointments,
  getDoctorLiveQueue,
} from "@/lib/doctor/queries";
import { TodayDashboard } from "@/features/doctor/today-dashboard";

export const metadata: Metadata = {
  title: "Doctor Console — ClinicQ",
  description: "Today's consultation schedule, patient intake summaries, urgency sorting, and one-click session tracking.",
};

export default function TodayPage() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
      <React.Suspense fallback={<TodayLoadingSkeleton />}>
        <TodayContent />
      </React.Suspense>
    </div>
  );
}

async function TodayContent() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="text-center text-xs text-muted-foreground py-12">
        Please sign in with a Doctor account to access the consultation console.
      </div>
    );
  }

  const doctor = await getMyDoctorProfile(user.id);

  if (!doctor) {
    return (
      <div className="text-center space-y-2 py-12">
        <h2 className="text-base font-semibold text-foreground">Doctor Profile Not Found</h2>
        <p className="text-xs text-muted-foreground">
          No clinical profile is associated with this account. Please contact clinic administration.
        </p>
      </div>
    );
  }

  const [appointments, queueDetails] = await Promise.all([
    getDoctorTodayAppointments(doctor.id),
    getDoctorLiveQueue(doctor.id),
  ]);

  return (
    <TodayDashboard
      doctor={doctor}
      initialQueueDetails={queueDetails}
      initialAppointments={appointments}
    />
  );
}

function TodayLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 bg-muted/60 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-40 bg-muted/40 rounded-2xl md:col-span-2" />
        <div className="h-40 bg-muted/40 rounded-2xl" />
      </div>
    </div>
  );
}
