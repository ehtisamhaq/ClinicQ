"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/config";
import {
  IconStethoscope,
  IconClock,
  IconUserCheck,
  IconUserX,
  IconPlayerPlay,
  IconCircleCheck,
  IconRobot,
  IconAlertTriangle,
  IconRefresh,
  IconBroadcast,
  IconChecklist,
  IconUsers,
  IconSparkles,
  IconHourglassLow,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppointmentItem, AppointmentStatusType, UrgencyLevelType } from "@/lib/appointments/types";
import type { DoctorProfileItem } from "@/lib/doctor/types";
import type { DoctorQueueDetails } from "@/lib/queue/types";
import { formatElapsedMinutes, calculateConsultationDurationMinutes, sortAppointmentsByUrgency } from "@/lib/doctor/utils";
import { updateQueueStatusAction } from "@/lib/queue/actions";
import { useQueueSocket } from "@/lib/socket/use-queue-socket";

interface TodayDashboardProps {
  doctor: DoctorProfileItem;
  initialQueueDetails: DoctorQueueDetails | null;
  initialAppointments: AppointmentItem[];
}

export function TodayDashboard({
  doctor,
  initialQueueDetails,
  initialAppointments,
}: TodayDashboardProps) {
  const router = useRouter();

  const [appointments, setAppointments] = React.useState<AppointmentItem[]>(initialAppointments);
  const [queueDetails, setQueueDetails] = React.useState<DoctorQueueDetails | null>(
    initialQueueDetails
  );
  const [isUpdating, startUpdateTransition] = React.useTransition();
  const [tab, setTab] = React.useState<"waiting" | "upcoming" | "completed">("waiting");

  // Re-fetch function on socket update or manual click
  const handleLiveRefresh = React.useCallback(async () => {
    try {
      const [aptRes, qRes] = await Promise.all([
        fetch(
          getApiUrl(
            `/appointments?doctorId=${doctor.id}&from=${new Date().toISOString().split("T")[0]}T00:00:00.000Z&limit=100`
          ),
          { cache: "no-store" }
        ).catch(() => null),
        fetch(getApiUrl(`/queue/doctor/${doctor.id}`), { cache: "no-store" }).catch(() => null),
      ]);

      if (aptRes?.ok) {
        const aptJson = await aptRes.json();
        if (aptJson.data) setAppointments(aptJson.data);
      }
      if (qRes?.ok) {
        const qJson = await qRes.json();
        if (qJson.data) setQueueDetails(qJson.data);
      }
    } catch {
      // Ignore network flutter on background refresh
    }
  }, [doctor.id]);

  // Hook into Socket.IO live updates for this specific doctor room
  const { isLive, isReconnecting } = useQueueSocket({
    doctorId: doctor.id,
    onRefresh: handleLiveRefresh,
    pollingIntervalMs: 12000,
  });

  // Derived subsets
  const inConsultationAppointment = React.useMemo(() => {
    return appointments.find((a) => a.status === "IN_CONSULTATION") || null;
  }, [appointments]);

  const waitingAppointments = React.useMemo(() => {
    const checkedIn = appointments.filter((a) => a.status === "CHECKED_IN");
    return sortAppointmentsByUrgency(checkedIn);
  }, [appointments]);

  const upcomingAppointments = React.useMemo(() => {
    return appointments
      .filter((a) => a.status === "BOOKED")
      .sort((a, b) => new Date(a.slot.startsAt).getTime() - new Date(b.slot.startsAt).getTime());
  }, [appointments]);

  const completedAppointments = React.useMemo(() => {
    return appointments
      .filter((a) => a.status === "COMPLETED")
      .sort((a, b) => {
        const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [appointments]);

  // Status transition handler
  const handleTransitionStatus = (
    appointmentId: string,
    status: "IN_CONSULTATION" | "COMPLETED" | "NO_SHOW",
    successMsg: string
  ) => {
    startUpdateTransition(async () => {
      const res = await updateQueueStatusAction({ appointmentId, status });
      if (!res.success) {
        toast.error(res.error || "Status update failed");
        return;
      }

      toast.success(successMsg);
      await handleLiveRefresh();
      router.refresh();
    });
  };

  const renderUrgencyBadge = (urgency: UrgencyLevelType) => {
    switch (urgency) {
      case "EMERGENCY":
        return <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider animate-pulse">Emergency</Badge>;
      case "URGENT":
        return <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 text-[10px] uppercase font-semibold">Urgent</Badge>;
      case "ROUTINE":
      default:
        return <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase">Routine</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border/80 bg-card/60 p-4 shadow-xs backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <IconStethoscope className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg font-bold text-foreground sm:text-xl">
                Dr. {doctor.user.email.split("@")[0]}
              </h1>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs font-medium text-muted-foreground">
                {doctor.specialty}
              </span>
              {doctor.roomNumber && (
                <Badge variant="secondary" className="text-[10px]">
                  Room {doctor.roomNumber}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  isLive
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                    : isReconnecting
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isLive ? "bg-emerald-500 animate-pulse" : isReconnecting ? "bg-amber-500 animate-ping" : "bg-muted-foreground"
                  }`}
                />
                {isLive ? "Live Sync Active" : isReconnecting ? "Reconnecting..." : "Offline Polling"}
              </div>
              <span className="text-xs text-muted-foreground">
                Adaptive rate: ~{queueDetails?.adaptiveConsultMinutes || doctor.avgConsultMinutes}m/patient
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLiveRefresh}
            className="gap-1.5 text-xs"
          >
            <IconRefresh className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Today Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Today
            </span>
            <div className="text-xl font-bold font-heading text-foreground">
              {appointments.length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Completed
            </span>
            <div className="text-xl font-bold font-heading text-emerald-600 dark:text-emerald-400">
              {completedAppointments.length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Waiting in Queue
            </span>
            <div className="text-xl font-bold font-heading text-amber-600 dark:text-amber-400">
              {waitingAppointments.length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Upcoming Booked
            </span>
            <div className="text-xl font-bold font-heading text-sky-600 dark:text-sky-400">
              {upcomingAppointments.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ACTIVE CONSULTATION CARD (Focus Area) */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Active Consultation Room
        </span>

        {inConsultationAppointment ? (
          <Card className="border-emerald-500/50 bg-emerald-500/5 shadow-md">
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-foreground">
                      Patient {inConsultationAppointment.patient.user.email.split("@")[0]}
                    </CardTitle>
                    {renderUrgencyBadge(inConsultationAppointment.urgency)}
                    <Badge variant="default" className="bg-emerald-600 text-white text-[10px] animate-pulse">
                      In Room Now
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Consultation started at{" "}
                    {inConsultationAppointment.consultStartedAt
                      ? new Date(inConsultationAppointment.consultStartedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recently"}{" "}
                    (Elapsed: {formatElapsedMinutes(inConsultationAppointment.consultStartedAt)})
                  </CardDescription>
                </div>

                <Button
                  onClick={() =>
                    handleTransitionStatus(
                      inConsultationAppointment.id,
                      "COMPLETED",
                      "Consultation marked as completed!"
                    )
                  }
                  disabled={isUpdating}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  <IconCircleCheck className="h-4 w-4" />
                  Complete Consultation
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-2 space-y-3">
              {/* Patient Reason */}
              <div className="rounded-lg border border-border/80 bg-background/80 p-3 space-y-1">
                <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Stated Consultation Reason:
                </span>
                <p className="text-xs text-foreground font-medium">
                  {inConsultationAppointment.reason}
                </p>
              </div>

              {/* AI Assistant Clinical Summary */}
              {inConsultationAppointment.assistantSummary && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                    <IconRobot className="h-4 w-4" />
                    AI Assistant Triage Context & Summary:
                  </div>
                  <p className="text-xs text-foreground italic">
                    &ldquo;{inConsultationAppointment.assistantSummary}&rdquo;
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/80 border-dashed bg-muted/20">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs font-semibold text-foreground">
                  Consultation room is ready.
                </div>
                <p className="text-xs text-muted-foreground">
                  {waitingAppointments.length > 0
                    ? `${waitingAppointments.length} patient(s) waiting in the reception queue.`
                    : "No patients currently in the waiting area."}
                </p>
              </div>

              {waitingAppointments.length > 0 && (
                <Button
                  onClick={() =>
                    handleTransitionStatus(
                      waitingAppointments[0]!.id,
                      "IN_CONSULTATION",
                      `Called patient ${waitingAppointments[0]!.patient.user.email.split("@")[0]} into room!`
                    )
                  }
                  disabled={isUpdating}
                  className="gap-2 font-semibold"
                >
                  <IconPlayerPlay className="h-4 w-4" />
                  Call Next: {waitingAppointments[0]!.patient.user.email.split("@")[0]}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Patient Queue Management Tabs */}
      <div className="space-y-4">
        <Tabs value={tab} onValueChange={(val) => setTab(val as "waiting" | "upcoming" | "completed")}>
          <TabsList>
            <TabsTrigger value="waiting" className="gap-2">
              <IconUsers className="h-4 w-4" />
              Waiting in Clinic ({waitingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <IconClock className="h-4 w-4" />
              Upcoming Scheduled ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <IconChecklist className="h-4 w-4" />
              Completed Today ({completedAppointments.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tab 1: Waiting In Clinic */}
        {tab === "waiting" && (
          <div className="space-y-3">
            {waitingAppointments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
                No checked-in patients waiting in the clinic right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {waitingAppointments.map((apt, index) => (
                  <Card key={apt.id} className="border-border/80 shadow-xs">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                              {apt.patient.user.email.split("@")[0]}
                              {apt.assistantSummary && (
                                <IconRobot className="h-3.5 w-3.5 text-primary" title="AI Assisted" />
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Arrived at{" "}
                              {apt.checkedInAt
                                ? new Date(apt.checkedInAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Earlier"}
                            </div>
                          </div>
                        </div>
                        {renderUrgencyBadge(apt.urgency)}
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-1 space-y-2">
                      <div className="rounded-md bg-muted/40 p-2 text-xs text-foreground">
                        {apt.reason}
                      </div>

                      {apt.assistantSummary && (
                        <div className="rounded-md bg-primary/5 p-2 text-[11px] text-muted-foreground italic flex items-center gap-1">
                          <span className="font-semibold text-primary not-italic text-[10px]">AI:</span>
                          {apt.assistantSummary}
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="p-4 pt-0 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleTransitionStatus(
                            apt.id,
                            "IN_CONSULTATION",
                            `Called patient ${apt.patient.user.email.split("@")[0]} into room!`
                          )
                        }
                        disabled={isUpdating}
                        className="gap-1.5 text-xs font-semibold"
                      >
                        <IconPlayerPlay className="h-3.5 w-3.5" />
                        Call Patient In
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Upcoming Booked */}
        {tab === "upcoming" && (
          <div className="space-y-3">
            {upcomingAppointments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
                No further booked appointments scheduled for today.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcomingAppointments.map((apt) => {
                  const time = new Date(apt.slot.startsAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <Card key={apt.id} className="border-border/80 shadow-xs">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-xs text-foreground">
                              {apt.patient.user.email.split("@")[0]}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <IconClock className="h-3 w-3" />
                              Scheduled: {time}
                            </div>
                          </div>
                          {renderUrgencyBadge(apt.urgency)}
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 pt-1 space-y-2">
                        <div className="rounded-md bg-muted/40 p-2 text-xs text-foreground">
                          {apt.reason}
                        </div>
                      </CardContent>

                      <CardFooter className="p-4 pt-0 flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">
                          Awaiting Check-in
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleTransitionStatus(
                              apt.id,
                              "NO_SHOW",
                              `Marked ${apt.patient.user.email.split("@")[0]} as No-Show.`
                            )
                          }
                          disabled={isUpdating}
                          className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                        >
                          Mark No-Show
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Completed Today */}
        {tab === "completed" && (
          <div className="space-y-3">
            {completedAppointments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
                No consultations completed yet today.
              </div>
            ) : (
              <div className="space-y-2">
                {completedAppointments.map((apt) => {
                  const duration = calculateConsultationDurationMinutes(
                    apt.consultStartedAt,
                    apt.completedAt
                  );
                  const timeFinished = apt.completedAt
                    ? new Date(apt.completedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Done";

                  return (
                    <Card key={apt.id} className="border-border/80 shadow-xs">
                      <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-xs text-foreground flex items-center gap-2">
                            {apt.patient.user.email.split("@")[0]}
                            <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300 border-emerald-300">
                              Completed
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-md">
                            {apt.reason}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <IconClock className="h-3.5 w-3.5" />
                            Finished at {timeFinished}
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            Duration: {duration}m
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
