import { Skeleton } from "@/components/ui/skeleton";

function TableSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-36 rounded" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      {/* Table header */}
      <div className="flex gap-4 pb-2 border-b border-border/60">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-20 rounded" />
        ))}
      </div>
      {/* Table rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2.5">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function AdminTableLoading() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-6">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-44 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <TableSkeleton />
      </div>
    </div>
  );
}
