import * as React from "react";
import type { Metadata } from "next";
import { getAdminDoctors } from "@/lib/admin/queries";
import { DoctorsTable } from "@/features/admin/doctors-table";

export const metadata: Metadata = {
  title: "Doctor Management — ClinicQ",
  description: "Manage clinic specialist profiles, consultation fees, and weekly consultation schedules.",
};

export default async function AdminDoctorsPage() {
  const doctors = await getAdminDoctors();

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Specialist Doctors Directory
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
          Configure specialist profiles, update consultation fees, and edit doctor availability.
        </p>
      </div>

      <DoctorsTable doctors={doctors} />
    </div>
  );
}
