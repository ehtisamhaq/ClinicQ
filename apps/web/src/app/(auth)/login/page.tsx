import * as React from "react";
import Link from "next/link";
import { IconHeartbeat, IconLoader } from "@tabler/icons-react";
import { LoginForm } from "@/features/auth/login-form";

export const metadata = {
  title: "Sign In — ClinicQ",
  description: "Sign in to access your appointments, live queue turn, or clinical staff console.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-muted/20">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-105">
              <IconHeartbeat className="h-6 w-6" />
            </div>
            <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Clinic<span className="text-primary font-normal">Q</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Sign in to ClinicQ
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs">
            Access your appointments, live queue turn, or clinical staff console.
          </p>
        </div>

        {/* Client interactive form wrapped in Suspense for useSearchParams */}
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center p-12">
              <IconLoader className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <LoginForm />
        </React.Suspense>

        {/* Public Tracker Link */}
        <div className="text-center">
          <Link
            href="/track"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Have a ticket? Track live queue without logging in →
          </Link>
        </div>
      </div>
    </div>
  );
}
