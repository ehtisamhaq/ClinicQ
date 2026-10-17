import * as React from "react";
import type { Metadata } from "next";
import { BookingWizard } from "@/features/booking/booking-wizard";
import { getSpecialties, getDoctors } from "@/lib/catalog/queries";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Book Doctor Appointment — ClinicQ",
  description: "Browse specialist doctors, select live available slots, and confirm appointments with conflict-free guarantees.",
};

export default async function BookDoctorPage() {
  const [specialties, doctors, user] = await Promise.all([
    getSpecialties(),
    getDoctors(),
    getSessionUser(),
  ]);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
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
  );
}
