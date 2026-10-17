import * as React from "react";
import type { Metadata } from "next";
import { getDoctors } from "@/lib/catalog/queries";
import { WalkInForm } from "@/features/queue/walk-in-form";

export const metadata: Metadata = {
  title: "Walk-in Registration — ClinicQ",
  description: "Register walk-in clinic patients, assign available consultation slots, and check them into the live queue.",
};

export default function WalkInPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
      <React.Suspense fallback={<WalkInLoadingSkeleton />}>
        <WalkInContent />
      </React.Suspense>
    </div>
  );
}

async function WalkInContent() {
  const doctors = await getDoctors();
  return <WalkInForm doctors={doctors} />;
}

function WalkInLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-muted/60 rounded-xl" />
      <div className="h-64 bg-muted/40 rounded-2xl" />
    </div>
  );
}
