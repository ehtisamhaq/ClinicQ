import * as React from "react";
import type { Metadata } from "next";
import { getDoctors } from "@/lib/catalog/queries";
import { WalkInForm } from "@/features/queue/walk-in-form";

export const metadata: Metadata = {
  title: "Walk-in Registration — ClinicQ",
  description: "Register walk-in clinic patients, assign available consultation slots, and check them into the live queue.",
};

export default async function WalkInPage() {
  const doctors = await getDoctors();

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
      <WalkInForm doctors={doctors} />
    </div>
  );
}
