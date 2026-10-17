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

export default async function TodayPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8 text-center text-xs text-muted-foreground">
        Please sign in with a Doctor account to access the consultation console.
      </div>
    );
  }

  const doctor = await getMyDoctorProfile(user.id);

  if (!doctor) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8 text-center space-y-2">
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
    <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
      <TodayDashboard
        doctor={doctor}
        initialQueueDetails={queueDetails}
        initialAppointments={appointments}
      />
    </div>
  );
}
