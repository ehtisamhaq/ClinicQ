"use client";

import * as React from "react";
import type { TrackingDetails } from "@/lib/tracking/types";
import {
  IconClock,
  IconUserCheck,
  IconStethoscope,
  IconCircleCheck,
  IconAlertCircle,
  IconRefresh,
  IconCalendar,
  IconMapPin,
  IconInfoCircle,
} from "@tabler/icons-react";

interface PublicTrackerProps {
  token: string;
  initialData: TrackingDetails;
}

export function PublicTracker({ token, initialData }: PublicTrackerProps) {
  const [data, setData] = React.useState<TrackingDetails>(initialData);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [secondsUntilPoll, setSecondsUntilPoll] = React.useState(10);

  // Initialize timestamp on client mount to avoid prerendering unstable date
  React.useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  const fetchLatest = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/track/${token}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to poll queue status:", err);
    } finally {
      setIsRefreshing(false);
      setSecondsUntilPoll(10);
    }
  }, [token]);

  // Polling timer
  React.useEffect(() => {
    const isTerminalState =
      data.status === "COMPLETED" ||
      data.status === "CANCELLED" ||
      data.status === "NO_SHOW";

    if (isTerminalState) return;

    const interval = setInterval(() => {
      setSecondsUntilPoll((prev) => {
        if (prev <= 1) {
          fetchLatest();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [data.status, fetchLatest]);

  const startsAtDate = new Date(data.slot.startsAt);
  const formattedTime = startsAtDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const formattedDate = startsAtDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const getStatusBadge = () => {
    switch (data.status) {
      case "BOOKED":
        return {
          bg: "bg-amber-500/10 text-amber-700 border-amber-300 dark:border-amber-700/40 dark:text-amber-400",
          label: "Booked (Pending Check-In)",
          desc: "Please arrive at the clinic 10 minutes before your slot and check in at the reception desk.",
        };
      case "CHECKED_IN":
        return {
          bg: "bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:border-emerald-700/40 dark:text-emerald-400",
          label: "Checked In — In Live Queue",
          desc: "You are currently in line. Please remain in the clinic lobby waiting area.",
        };
      case "IN_CONSULTATION":
        return {
          bg: "bg-blue-500/10 text-blue-700 border-blue-300 dark:border-blue-700/40 dark:text-blue-400 animate-pulse",
          label: "In Consultation Now",
          desc: "Please enter the doctor's consultation room now.",
        };
      case "COMPLETED":
        return {
          bg: "bg-taupe-500/10 text-taupe-700 border-taupe-300 dark:border-taupe-700/40 dark:text-taupe-300",
          label: "Consultation Completed",
          desc: "Thank you for visiting ClinicQ. Have a healthy day!",
        };
      case "CANCELLED":
        return {
          bg: "bg-rose-500/10 text-rose-700 border-rose-300 dark:border-rose-700/40 dark:text-rose-400",
          label: "Appointment Cancelled",
          desc: "This appointment was cancelled.",
        };
      case "NO_SHOW":
        return {
          bg: "bg-rose-500/10 text-rose-700 border-rose-300 dark:border-rose-700/40 dark:text-rose-400",
          label: "Marked No-Show",
          desc: "Patient was not present when called for consultation.",
        };
      default:
        return {
          bg: "bg-surface-2 text-foreground border-border",
          label: data.status,
          desc: "",
        };
    }
  };

  const statusConfig = getStatusBadge();

  // Lifecycle steps
  const steps = [
    { id: "BOOKED", label: "Booked", icon: IconCalendar },
    { id: "CHECKED_IN", label: "Checked In", icon: IconUserCheck },
    { id: "IN_CONSULTATION", label: "With Doctor", icon: IconStethoscope },
    { id: "COMPLETED", label: "Completed", icon: IconCircleCheck },
  ];

  const getStepState = (stepId: string) => {
    if (data.status === "CANCELLED" || data.status === "NO_SHOW") return "inactive";

    const order = ["BOOKED", "CHECKED_IN", "IN_CONSULTATION", "COMPLETED"];
    const currentIndex = order.indexOf(data.status);
    const stepIndex = order.indexOf(stepId);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Live status header banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/60">
          <div>
            <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
              Live Queue Tracker
            </span>
            <h1 className="text-2xl font-serif font-bold text-foreground mt-0.5">
              Appointment Status
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Syncing ({secondsUntilPoll}s)</span>
            </div>

            <button
              onClick={fetchLatest}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card hover:bg-muted text-foreground transition-colors disabled:opacity-50"
            >
              <IconRefresh className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Callout */}
        <div className="mt-5 space-y-3">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${statusConfig.bg}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {statusConfig.label}
          </div>
          <p className="text-sm text-foreground/80 font-sans">
            {statusConfig.desc}
          </p>
        </div>

        {/* Stepper */}
        {data.status !== "CANCELLED" && data.status !== "NO_SHOW" && (
          <div className="mt-8 pt-6 border-t border-border/60">
            <div className="grid grid-cols-4 gap-2">
              {steps.map((step, idx) => {
                const state = getStepState(step.id);
                const Icon = step.icon;

                return (
                  <div key={step.id} className="flex flex-col items-center text-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        state === "completed"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : state === "current"
                          ? "ring-2 ring-primary ring-offset-2 bg-primary/10 text-primary font-bold animate-pulse"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        state === "current"
                          ? "text-primary font-semibold"
                          : state === "completed"
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Step {idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main turn & wait metrics (if checked in) */}
      {data.status === "CHECKED_IN" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center flex flex-col justify-center shadow-xs">
            <span className="text-xs uppercase font-medium tracking-wider text-primary">
              Your Position
            </span>
            <div className="text-4xl font-extrabold font-serif text-primary mt-1">
              #{data.queuePosition ?? 1}
            </div>
            <span className="text-[11px] text-muted-foreground mt-1">in today&apos;s queue</span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 text-center flex flex-col justify-center shadow-xs">
            <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
              Patients Ahead
            </span>
            <div className="text-3xl font-bold font-serif text-foreground mt-1">
              {data.patientsAhead}
            </div>
            <span className="text-[11px] text-muted-foreground mt-1">
              {data.patientsAhead === 0 ? "You are next in turn!" : "waiting before you"}
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 text-center flex flex-col justify-center shadow-xs">
            <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
              Estimated Wait
            </span>
            <div className="text-3xl font-bold font-serif text-foreground mt-1">
              ~{data.estimatedWaitMinutes}m
            </div>
            <span className="text-[11px] text-muted-foreground mt-1">adaptive estimate</span>
          </div>
        </div>
      )}

      {/* When booked but not checked in */}
      {data.status === "BOOKED" && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-start gap-3.5">
          <IconAlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <div className="font-semibold text-amber-900 dark:text-amber-200">
              Not Checked In Yet
            </div>
            <p className="text-amber-800/80 dark:text-amber-300/80">
              Your queue position and live turn number will be activated once you reach the clinic reception and check in with the desk.
            </p>
          </div>
        </div>
      )}

      {/* Appointment & Doctor details */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
        <h2 className="text-base font-semibold text-foreground font-serif">
          Appointment Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <IconStethoscope className="h-4 w-4" />
              <span>Assigned Specialist</span>
            </div>
            <div className="font-medium text-foreground text-base">
              {data.doctor.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </div>
            <div className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium">
              {data.doctor.specialty}
            </div>
            <div className="text-xs text-muted-foreground pt-1">
              Consultation Fee: <span className="font-semibold text-foreground">৳{Number(data.doctor.consultationFee)}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <IconClock className="h-4 w-4" />
              <span>Scheduled Slot</span>
            </div>
            <div className="font-medium text-foreground text-base">
              {formattedTime}
            </div>
            <div className="text-xs text-muted-foreground">
              {formattedDate}
            </div>
            <div className="text-xs text-muted-foreground pt-1">
              Patient: <span className="font-semibold text-foreground">Initials {data.patientInitials}</span>
            </div>
          </div>
        </div>

        {/* Clinic info & instructions */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <IconMapPin className="h-4 w-4 text-primary" />
            <span>Clinic Location & Lobby Instructions</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            ClinicQ Medical Complex, Floor 3, Room 302. Please ensure your mobile phone is kept on vibrate and keep this tracker page open on your browser for instant audio/visual turn alerts.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 pt-1">
            <IconInfoCircle className="h-3.5 w-3.5" />
            <span>
              {lastUpdated
                ? `Last synchronized at ${lastUpdated.toLocaleTimeString()}`
                : "Synchronizing..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
