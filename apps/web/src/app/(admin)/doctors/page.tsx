import * as React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionUser } from "@/lib/auth/session";
import { getAdminDoctors } from "@/lib/admin/queries";
import { DoctorsTable } from "@/features/admin/doctors-table";

export const metadata: Metadata = {
  title: "Doctor Management — ClinicQ",
  description: "Manage clinic specialist profiles, consultation fees, and weekly consultation schedules.",
};

function DoctorsSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-6 sm:p-8 space-y-6">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  );
}

async function DoctorsContent() {
  const [user, doctors] = await Promise.all([
    getSessionUser(),
    getAdminDoctors(),
  ]);

  return (
    <AppShell user={user}>
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
    </AppShell>
  );
}

export default function AdminDoctorsPage() {
  return (
    <React.Suspense fallback={<DoctorsSkeleton />}>
      <DoctorsContent />
    </React.Suspense>
  );
}
