import Link from "next/link";
import {
  IconRobot,
  IconCalendar,
  IconClockPlay,
  IconStethoscope,
  IconShieldCheck,
  IconArrowRight,
  IconHeartbeat,
  IconSparkles,
  IconLock,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <IconHeartbeat className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                Clinic<span className="text-primary font-normal">Q</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground -mt-1">
                Dhaka Central
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <Link href="/track" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <IconClockPlay className="h-4 w-4" />
                Track Queue
              </Button>
            </Link>
            <Link href="/book" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <IconCalendar className="h-4 w-4" />
                Doctors
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <IconLock className="h-3.5 w-3.5" />
                Sign In
              </Button>
            </Link>
            <Link href="/assistant">
              <Button size="sm" className="gap-1.5 text-xs shadow-sm">
                <IconRobot className="h-3.5 w-3.5" />
                AI Assistant
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32">
          {/* Subtle background ambient gradients */}
          <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
            <div className="h-[400px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
            <div className="h-[300px] w-[400px] rounded-full bg-accent/30 blur-2xl -translate-y-20 translate-x-20" />
          </div>

          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm shadow-xs mb-8">
              <IconSparkles className="h-3.5 w-3.5 text-primary" />
              <span>Next-Generation Clinic Flow • Multilingual AI</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">v1.0</Badge>
            </div>

            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Healthcare queueing,{" "}
              <span className="bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
                honest to the minute.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Describe your symptoms in English, Bangla, or mixed phrasing. Our clinical assistant finds the right specialist, secures a guaranteed conflict-free slot, and keeps you updated with adaptive live queue estimates.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link href="/assistant" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 px-6 shadow-md text-sm font-semibold">
                  <IconRobot className="h-4 w-4" />
                  Talk to AI Assistant
                  <IconArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/book" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 px-6 text-sm">
                  <IconCalendar className="h-4 w-4" />
                  Manual Doctor Booking
                </Button>
              </Link>
              <Link href="/track" className="w-full sm:w-auto">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto gap-2 px-6 text-sm">
                  <IconClockPlay className="h-4 w-4" />
                  Live Queue Tracker
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="border-t border-border/60 bg-muted/30 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Engineered for Patients, Doctors, and Reception
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                No double bookings. No blind queues. Full clinical context on every turn.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <Card className="border border-border/80 bg-card/80 backdrop-blur-xs transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                    <IconRobot className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Conversational Booking</CardTitle>
                  <CardDescription>
                    Understands colloquial Bangla, English, and Banglish. Evaluates symptoms, routes emergencies to urgent care, and finds matching doctors.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 2 */}
              <Card className="border border-border/80 bg-card/80 backdrop-blur-xs transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                    <IconShieldCheck className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Conflict-Free Allocation</CardTitle>
                  <CardDescription>
                    Serialized database slot locking guarantees atomic double-booking prevention under peak concurrent loads.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 3 */}
              <Card className="border border-border/80 bg-card/80 backdrop-blur-xs transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                    <IconClockPlay className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Live Adaptive Queue</CardTitle>
                  <CardDescription>
                    Real-time WebSocket queue board. Wait times recalculate dynamically based on each doctor&apos;s actual consultation pace.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 4 */}
              <Card className="border border-border/80 bg-card/80 backdrop-blur-xs transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                    <IconStethoscope className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Doctor Today View</CardTitle>
                  <CardDescription>
                    Doctors receive structured pre-consultation patient summaries, chief complaints, and urgency scores right on their dashboard.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 5 */}
              <Card className="border border-border/80 bg-card/80 backdrop-blur-xs transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                    <IconCalendar className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Fast Manual Booking</CardTitle>
                  <CardDescription>
                    Filter by specialty, fee cap, language, and gender with instantaneous slot availability and zero-fuss confirmation.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 6 */}
              <Card className="border border-border/80 bg-card/80 backdrop-blur-xs transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                    <IconSparkles className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Clinic Knowledge RAG</CardTitle>
                  <CardDescription>
                    Postgres pgvector-powered semantic search answers clinic timings, fees, services, and doctor bios accurately.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 ClinicQ Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/track" className="hover:text-foreground">Track Queue</Link>
            <Link href="/book" className="hover:text-foreground">Find Doctor</Link>
            <Link href="/login" className="hover:text-foreground">Staff Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
