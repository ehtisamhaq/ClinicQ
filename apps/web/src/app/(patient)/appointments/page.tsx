import * as React from "react";
import Link from "next/link";
import { IconStethoscope, IconRobot } from "@tabler/icons-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionUser } from "@/lib/auth/session";
import { getMyAppointments } from "@/lib/appointments/queries";
import { AppointmentsTable } from "@/features/appointments/appointments-table";

export const metadata = {
  title: "My Appointments — ClinicQ",
  description: "View, manage, reschedule or cancel your clinic appointments and track live queue turns.",
};

function AppointmentsSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-6 sm:p-8 space-y-6">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Card className="border-border/80">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function AppointmentsContent() {
  const [user, { appointments }] = await Promise.all([
    getSessionUser(),
    getMyAppointments(),
  ]);

  return (
    <AppShell user={user}>
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

        {/* Dynamic Appointments Table */}
        <AppointmentsTable appointments={appointments} />
      </div>
    </AppShell>
  );
}

export default function MyAppointmentsPage() {
  return (
    <React.Suspense fallback={<AppointmentsSkeleton />}>
      <AppointmentsContent />
    </React.Suspense>
  );
}
