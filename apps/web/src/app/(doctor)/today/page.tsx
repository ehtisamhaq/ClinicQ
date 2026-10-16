import * as React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import {
  getMyDoctorProfile,
  getDoctorTodayAppointments,
  getDoctorLiveQueue,
} from "@/lib/doctor/queries";
import { TodayDashboard } from "@/features/doctor/today-dashboard";

export const metadata: Metadata = {
  title: "Doctor Today — ClinicQ",
  description: "Doctor consultation schedule, active room management, and live waiting patient queue.",
};

function TodaySkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-6 sm:p-8 space-y-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

async function TodayContent() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <AppShell user={null}>
        <div className="container max-w-5xl mx-auto px-4 py-8 text-center text-xs text-muted-foreground">
          Please sign in with a Doctor account to access the consultation console.
        </div>
      </AppShell>
    );
  }

  // Find doctor profile for this user
  const doctor = await getMyDoctorProfile(user.id);

  if (!doctor) {
    return (
      <AppShell user={user}>
        <div className="container max-w-5xl mx-auto px-4 py-8 text-center space-y-2">
          <h2 className="text-base font-semibold text-foreground">Doctor Profile Not Found</h2>
          <p className="text-xs text-muted-foreground">
            No clinical profile is associated with this account. Please contact clinic administration.
          </p>
        </div>
      </AppShell>
    );
  }

  const [appointments, queueDetails] = await Promise.all([
    getDoctorTodayAppointments(doctor.id),
    getDoctorLiveQueue(doctor.id),
  ]);

  return (
    <AppShell user={user}>
      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
        <TodayDashboard
          doctor={doctor}
          initialQueueDetails={queueDetails}
          initialAppointments={appointments}
        />
      </div>
    </AppShell>
  );
}

export default function TodayPage() {
  return (
    <React.Suspense fallback={<TodaySkeleton />}>
      <TodayContent />
    </React.Suspense>
  );
}
