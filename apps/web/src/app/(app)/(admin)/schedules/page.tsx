import * as React from "react";
import type { Metadata } from "next";
import { getAdminDoctors, getAdminDoctorSchedules } from "@/lib/admin/queries";
import { SchedulesManager } from "@/features/admin/schedules-manager";

export const metadata: Metadata = {
  title: "Weekly Schedules — ClinicQ",
  description: "Configure weekly doctor consultation timetables, session windows and slot durations.",
};

export default async function AdminSchedulesPage() {
  const doctors = await getAdminDoctors();
  const firstDoctorId = doctors[0]?.id;
  const initialSchedules = firstDoctorId
    ? await getAdminDoctorSchedules(firstDoctorId)
    : [];

  return (
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
  );
}
