import * as React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionUser } from "@/lib/auth/session";
import { getAdminDashboardMetrics } from "@/lib/admin/queries";
import { DashboardView } from "@/features/admin/dashboard-view";

export const metadata: Metadata = {
  title: "Admin Dashboard — ClinicQ",
  description: "Clinic operational metrics, appointment flow, wait estimates, doctor utilization and AI performance.",
};

function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-6 sm:p-8 space-y-6">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-64 rounded-xl" />
          <Skeleton className="lg:col-span-5 h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

async function DashboardContent() {
  const [user, metrics] = await Promise.all([
    getSessionUser(),
    getAdminDashboardMetrics(),
  ]);

  if (!metrics) {
    return (
      <AppShell user={user}>
        <div className="container max-w-6xl mx-auto px-4 py-8 text-center text-xs text-muted-foreground">
          Could not load clinic metrics. Please check admin authorization.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Operations Dashboard
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
            Key operational metrics, doctor schedule capacity, queue efficiency, and AI assistant booking rates.
          </p>
        </div>

        <DashboardView metrics={metrics} />
      </div>
    </AppShell>
  );
}

export default function AdminDashboardPage() {
  return (
    <React.Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </React.Suspense>
  );
}
