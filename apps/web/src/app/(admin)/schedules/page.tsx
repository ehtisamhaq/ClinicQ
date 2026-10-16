import * as React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionUser } from "@/lib/auth/session";
import { getAdminDoctors, getAdminDoctorSchedules } from "@/lib/admin/queries";
import { SchedulesManager } from "@/features/admin/schedules-manager";

export const metadata: Metadata = {
  title: "Weekly Schedules — ClinicQ",
  description: "Configure weekly doctor consultation timetables, session windows and slot durations.",
};

function SchedulesSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-6 sm:p-8 space-y-6">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-[500px] w-full max-w-4xl mx-auto rounded-xl" />
      </div>
    </div>
  );
}

async function SchedulesContent() {
  const [user, doctors] = await Promise.all([
    getSessionUser(),
    getAdminDoctors(),
  ]);

  const firstDoctorId = doctors[0]?.id;
  const initialSchedules = firstDoctorId
    ? await getAdminDoctorSchedules(firstDoctorId)
    : [];

  return (
    <AppShell user={user}>
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Doctor Consultation Schedules
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
            Manage weekly recurring schedule templates. The platform generates appointment slots automatically.
          </p>
        </div>

        <SchedulesManager
          doctors={doctors}
          initialDoctorId={firstDoctorId}
          initialSchedules={initialSchedules}
        />
      </div>
    </AppShell>
  );
}

export default function AdminSchedulesPage() {
  return (
    <React.Suspense fallback={<SchedulesSkeleton />}>
      <SchedulesContent />
    </React.Suspense>
  );
}
