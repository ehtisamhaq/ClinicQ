import * as React from "react";
import type { Metadata } from "next";
import { getAdminDashboardMetrics } from "@/lib/admin/queries";
import { DashboardView } from "@/features/admin/dashboard-view";
import { DashboardFilters } from "@/features/admin/dashboard-filters";

export const metadata: Metadata = {
  title: "Admin Dashboard — ClinicQ",
  description: "Clinic operational metrics, doctor schedule capacity, queue efficiency, and AI assistant booking rates.",
};

interface DashboardPageProps {
  searchParams: Promise<{ from?: string; to?: string; doctorId?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const metrics = await getAdminDashboardMetrics(params.from, params.to);

  if (!metrics) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8 text-center text-xs text-muted-foreground">
        Could not load clinic metrics. Please check admin authorization.
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Operations Dashboard
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
            Key operational metrics, doctor schedule capacity, queue efficiency, and AI assistant booking rates.
            {params.from && params.to && (
              <span className="ml-1.5 text-primary font-medium">
                ({new Date(params.from).toLocaleDateString()} – {new Date(params.to).toLocaleDateString()})
              </span>
            )}
          </p>
        </div>
        <DashboardFilters />
      </div>

      <DashboardView metrics={metrics} />
    </div>
  );
}
