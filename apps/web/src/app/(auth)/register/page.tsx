import Link from "next/link";
import { IconHeartbeat } from "@tabler/icons-react";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata = {
  title: "Register — ClinicQ",
  description: "Create a patient account to book appointments and track live clinic queue turns.",
};

export default function RegisterPage() {
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
            Create Patient Account
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs">
            Book appointments with AI, manage personal queue turns, and track visits.
          </p>
        </div>

        {/* Client interactive form */}
        <RegisterForm />
      </div>
    </div>
  );
}
