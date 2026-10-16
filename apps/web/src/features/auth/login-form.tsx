"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconLock,
  IconMail,
  IconEye,
  IconEyeOff,
  IconLoader,
  IconArrowRight,
  IconShieldLock,
  IconStethoscope,
  IconUserCheck,
  IconUser,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAction } from "@/lib/auth/actions";

const DEMO_ACCOUNTS = [
  {
    role: "PATIENT",
    label: "Patient",
    email: "patient1@clinicq.com",
    password: "Patient123!",
    icon: IconUser,
  },
  {
    role: "DOCTOR",
    label: "Doctor",
    email: "dr.sarah@clinicq.com",
    password: "Doctor123!",
    icon: IconStethoscope,
  },
  {
    role: "RECEPTIONIST",
    label: "Receptionist",
    email: "reception@clinicq.com",
    password: "Reception123!",
    icon: IconUserCheck,
  },
  {
    role: "ADMIN",
    label: "Admin",
    email: "admin@clinicq.com",
    password: "Admin123!",
    icon: IconShieldLock,
  },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleDemoFill = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMessage(null);
    toast.info(`Filled demo credentials for ${acc.label}`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    if (from) formData.set("from", from);

    startTransition(async () => {
      const result = await loginAction(null, formData);

      if (!result.success) {
        setErrorMessage(result.error || "Login failed");
        toast.error(result.error || "Login failed");
        return;
      }

      toast.success(result.message || "Logged in successfully");
      const target = result.data?.redirectTo || "/";
      router.push(target);
      router.refresh();
    });
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Demo Quick-Fill Bar */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 backdrop-blur-sm shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Demo Credentials (1-Click Fill)
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Demo</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            const isSelected = email === acc.email;
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleDemoFill(acc)}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                    : "border-border/60 bg-background/50 hover:bg-muted text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="truncate">
                  <div className="truncate leading-tight">{acc.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{acc.email.split("@")[0]}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Login Card */}
      <Card className="border-border/80 shadow-md">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-base font-semibold">Account Credentials</CardTitle>
          <CardDescription className="text-xs">
            Enter your registered email address and password.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email Address</Label>
              <div className="relative">
                <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@clinicq.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-sm"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs">Password</Label>
              </div>
              <div className="relative">
                <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 text-sm"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <IconEyeOff className="h-4 w-4" />
                  ) : (
                    <IconEye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" disabled={isPending} className="w-full gap-2 text-sm font-semibold">
              {isPending ? (
                <>
                  <IconLoader className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <IconArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                Create patient account
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
