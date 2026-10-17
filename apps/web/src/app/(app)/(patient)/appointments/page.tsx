import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { IconStethoscope, IconRobot } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { getMyAppointments } from "@/lib/appointments/queries";
import { getMyWaitlist } from "@/lib/waitlist/queries";
import { AppointmentsTable } from "@/features/appointments/appointments-table";
import { WaitlistSection } from "@/features/waitlist/waitlist-section";

export const metadata: Metadata = {
  title: "My Appointments — ClinicQ",
  description: "View, manage, reschedule or cancel your clinic appointments and track live queue turns.",
};

export default async function MyAppointmentsPage() {
  const [{ appointments }, waitlistEntries] = await Promise.all([
    getMyAppointments(),
    getMyWaitlist(),
  ]);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Appointments
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Keep track of your upcoming clinic visits, manage bookings, and view live queue turns on consultation day.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            render={<Link href="/assistant" />}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <IconRobot className="h-4 w-4 text-primary" />
            AI Assistant
          </Button>
          <Button
            render={<Link href="/book" />}
            size="sm"
            className="gap-1.5 text-xs"
          >
            <IconStethoscope className="h-4 w-4" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Active Priority Waitlists */}
      <WaitlistSection entries={waitlistEntries} />

      {/* Dynamic Appointments Table */}
      <AppointmentsTable appointments={appointments} />
    </div>
  );
}
