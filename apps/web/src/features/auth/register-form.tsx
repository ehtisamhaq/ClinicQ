"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconLock,
  IconMail,
  IconPhone,
  IconEye,
  IconEyeOff,
  IconLoader,
  IconArrowRight,
  IconLanguage,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { registerAction } from "@/lib/auth/actions";

export function RegisterForm() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [language, setLanguage] = React.useState("en");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    if (phone) formData.set("phone", phone);
    formData.set("preferredLanguage", language);

    startTransition(async () => {
      const result = await registerAction(null, formData);

      if (!result.success) {
        setErrorMessage(result.error || "Registration failed");
        toast.error(result.error || "Registration failed");
        return;
      }

      toast.success("Account created successfully! Welcome to ClinicQ.");
      const target = result.data?.redirectTo || "/assistant";
      router.push(target);
      router.refresh();
    });
  };

  return (
    <Card className="border-border/80 shadow-md">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-base font-semibold">Patient Details</CardTitle>
        <CardDescription className="text-xs">
          Fill in your contact information below.
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
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-sm"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">Password (min 8 characters)</Label>
            <div className="relative">
              <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9 text-sm"
                autoComplete="new-password"
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

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs">Phone Number (optional)</Label>
            <div className="relative">
              <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+880 1711-000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-9 text-sm"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="language" className="text-xs">Preferred Assistant Language</Label>
            <div className="relative">
              <IconLanguage className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                id="language"
                name="preferredLanguage"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="en" className="bg-background text-foreground">English</option>
                <option value="bn" className="bg-background text-foreground">Bangla (বাংলা)</option>
              </select>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button type="submit" disabled={isPending} className="w-full gap-2 text-sm font-semibold">
            {isPending ? (
              <>
                <IconLoader className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Complete Registration
                <IconArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
