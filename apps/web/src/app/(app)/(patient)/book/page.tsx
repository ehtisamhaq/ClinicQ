import * as React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { BookingWizard } from "@/features/booking/booking-wizard";
import { getSpecialties, getDoctors } from "@/lib/catalog/queries";
import { getSessionUser } from "@/lib/auth/session";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Book Doctor Appointment — ClinicQ",
  description: "Browse specialist doctors, select live available slots, and confirm appointments with conflict-free guarantees.",
};

function BookingSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-6 sm:p-8 space-y-6">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function BookingContent() {
  const [specialties, doctors, user] = await Promise.all([
    getSpecialties(),
    getDoctors(),
    getSessionUser(),
  ]);

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-heading">
            Doctor Directory & Booking
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Browse our clinical specialists, view consultation fees, and select your preferred slot.
          </p>
        </div>

        <BookingWizard
          specialties={specialties}
          initialDoctors={doctors}
          user={user}
        />
      </div>
    </AppShell>
  );
}

export default function BookDoctorPage() {
  return (
    <React.Suspense fallback={<BookingSkeleton />}>
      <BookingContent />
    </React.Suspense>
  );
}
