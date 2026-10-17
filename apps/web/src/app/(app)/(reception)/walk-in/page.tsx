import * as React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionUser } from "@/lib/auth/session";
import { getDoctors } from "@/lib/catalog/queries";
import { WalkInForm } from "@/features/queue/walk-in-form";

export const metadata: Metadata = {
  title: "Walk-in Registration — ClinicQ",
  description: "Register walk-in clinic patients, assign available consultation slots, and check them into the live queue.",
};

function WalkInSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-6 sm:p-8 space-y-6">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-96 w-full max-w-2xl mx-auto rounded-xl" />
      </div>
    </div>
  );
}

async function WalkInContent() {
  const [user, doctors] = await Promise.all([
    getSessionUser(),
    getDoctors(),
  ]);

  return (
    <AppShell user={user}>
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        <WalkInForm doctors={doctors} />
      </div>
    </AppShell>
  );
}

export default function WalkInPage() {
  return (
    <React.Suspense fallback={<WalkInSkeleton />}>
      <WalkInContent />
    </React.Suspense>
  );
}
