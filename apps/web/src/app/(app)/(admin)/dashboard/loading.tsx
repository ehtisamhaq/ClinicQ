import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-6">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-80 rounded" />
          </div>
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3.5 space-y-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-7 w-16 rounded" />
              <Skeleton className="h-2.5 w-12 rounded" />
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-52 w-full rounded-lg" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-52 w-full rounded-lg" />
          </div>
        </div>

        {/* Utilization table */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <Skeleton className="h-5 w-36 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-full rounded flex-1" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
