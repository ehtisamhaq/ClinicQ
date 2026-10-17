"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconStethoscope,
  IconClock,
  IconUserCheck,
  IconUserX,
  IconRefresh,
  IconAlertTriangle,
  IconRobot,
  IconCheck,
  IconPlayerPlay,
  IconCircleCheck,
  IconWalk,
  IconTicket,
  IconBroadcast,
  IconUsers,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  DoctorQueueSummary,
  DoctorQueueDetails,
  CheckedInQueueItem,
  UpcomingBookedItem,
} from "@/lib/queue/types";
import {
  updateQueueStatusAction,
  refreshClinicQueueAction,
  refreshDoctorQueueAction,
} from "@/lib/queue/actions";
import { useQueueSocket } from "@/lib/socket/use-queue-socket";

interface LiveQueueBoardProps {
  initialSummaries: DoctorQueueSummary[];
  initialSelectedDoctorDetails: DoctorQueueDetails | null;
  currentUser?: {
    id: string;
    email: string;
    role: string;
  } | null;
}

export function LiveQueueBoard({
  initialSummaries,
  initialSelectedDoctorDetails,
  currentUser,
}: LiveQueueBoardProps) {
  const router = useRouter();
  const [summaries, setSummaries] = React.useState<DoctorQueueSummary[]>(initialSummaries);
  const [selectedDoctorId, setSelectedDoctorId] = React.useState<string>(
    initialSelectedDoctorDetails?.doctor.id || initialSummaries[0]?.doctorId || ""
  );
  const [details, setDetails] = React.useState<DoctorQueueDetails | null>(
    initialSelectedDoctorDetails
  );
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
  const [isUpdatingStatus, startStatusTransition] = React.useTransition();

  // Role check: Only staff (ADMIN/RECEPTIONIST) or the doctor assigned to this room can trigger status transitions
  const isStaff = currentUser?.role === "ADMIN" || currentUser?.role === "RECEPTIONIST";
  const isMyConsultRoom = currentUser?.role === "DOCTOR" && details?.doctor.email === currentUser.email;
  const canManageRoom = isStaff || isMyConsultRoom;

  // Fetch full details for the currently selected doctor via authenticated server action
  const fetchDoctorDetails = React.useCallback(async (docId: string) => {
    if (!docId) return;
    try {
      const data = await refreshDoctorQueueAction(docId);
      if (data) {
        setDetails(data);
      }
    } catch {
      // Keep existing details if network flickers
    }
  }, []);

  // Refresh summaries and details on socket update or periodic poll via authenticated server action
  const handleLiveRefresh = React.useCallback(async () => {
    try {
      const updatedSummaries = await refreshClinicQueueAction();
      if (Array.isArray(updatedSummaries)) {
        setSummaries(updatedSummaries);
      }
    } catch {
      // Silent error on polling
    }

    if (selectedDoctorId) {
      await fetchDoctorDetails(selectedDoctorId);
    }
  }, [selectedDoctorId, fetchDoctorDetails]);

  // Hook into Socket.IO live updates for this doctor and the clinic room
  const { isLive, isReconnecting, connectionState } = useQueueSocket({
    doctorId: selectedDoctorId,
    onRefresh: handleLiveRefresh,
    pollingIntervalMs: 12000,
  });

  const handleSelectDoctor = (docId: string) => {
    setSelectedDoctorId(docId);
    setIsLoadingDetails(true);
    fetchDoctorDetails(docId).finally(() => setIsLoadingDetails(false));
  };

  const handleUpdateStatus = (
    appointmentId: string,
    status: "CHECKED_IN" | "IN_CONSULTATION" | "COMPLETED" | "NO_SHOW",
    successMsg: string
  ) => {
    startStatusTransition(async () => {
      const result = await updateQueueStatusAction({ appointmentId, status });
      if (!result.success) {
        toast.error(result.error || "Status update failed");
        return;
      }

      toast.success(successMsg);
      await handleLiveRefresh();
      router.refresh();
    });
  };

  const renderUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "EMERGENCY":
        return (
          <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 gap-1 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Emergency
          </Badge>
        );
      case "URGENT":
        return (
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
            Urgent
          </Badge>
        );
      case "ROUTINE":
      default:
        return (
          <Badge variant="outline" className="text-[10px] uppercase font-medium border-border/80 text-muted-foreground px-2 py-0.5">
            Routine
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border/80 bg-card/60 p-4 shadow-xs backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <IconBroadcast className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base font-semibold text-foreground">
                Clinic Live Queue
              </h2>
              {/* Connection Status Indicator */}
              <div
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                  isLive
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                    : isReconnecting
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isLive
                      ? "bg-emerald-500 animate-pulse"
                      : isReconnecting
                      ? "bg-amber-500 animate-ping"
                      : "bg-muted-foreground"
                  }`}
                />
                {isLive ? "Live Sync Active" : isReconnecting ? "Reconnecting (Polling)" : "Polling Fallback"}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Monitor active consultations, check-in arrivals, and manage doctor turns in real-time.
            </p>
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

          <Button
            render={<Link href="/walk-in" />}
            size="sm"
            className="gap-1.5 text-xs font-semibold"
          >
            <IconWalk className="h-4 w-4" />
            Walk-in Patient
          </Button>
        </div>
      </div>

      {/* Doctor Summary Grid / Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Specialist Consult Rooms ({summaries.length})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {summaries.map((doc) => {
            const isSelected = doc.doctorId === selectedDoctorId;
            const docName = doc.doctorEmail
              .split("@")[0]
              .replace(/\./g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            const initials = docName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

            return (
              <button
                key={doc.doctorId}
                type="button"
                onClick={() => handleSelectDoctor(doc.doctorId)}
                className={`relative flex flex-col p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-border/80 bg-card/80 hover:bg-muted/40 hover:border-border hover:shadow-2xs text-foreground"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs shadow-2xs">
                      {initials}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-xs text-foreground truncate">
                        Dr. {docName}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate font-medium">
                        {doc.specialty}
                      </div>
                    </div>
                  </div>
                  {doc.inConsultationCount > 0 ? (
                    <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-emerald-600 text-white shrink-0 font-bold gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      In Room
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 text-muted-foreground shrink-0 font-medium">
                      Idle
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-2.5 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <IconUsers className="h-3.5 w-3.5 text-primary" />
                    <span>
                      <strong className="text-foreground">{doc.checkedInCount}</strong> waiting
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>
                      <strong className="text-foreground">{doc.bookedCount}</strong> booked
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold border-primary/20 text-foreground">
                    ~{doc.estimatedTotalWaitMinutes}m wait
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Doctor Queue Lanes */}
      {isLoadingDetails ? (
        <div className="h-64 rounded-xl border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground animate-pulse">
          Loading live queue lanes...
        </div>
      ) : !details ? (
        <div className="h-48 rounded-xl border border-border p-8 text-center text-xs text-muted-foreground">
          Select a doctor above to inspect live consultation lanes.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LANE 1: In Consultation Room (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Consultation Room
              </span>
              <Badge variant="outline" className="text-[10px]">
                Adaptive: ~{details.adaptiveConsultMinutes}m/pt
              </Badge>
            </div>

            {details.currentConsultation ? (
              <Card className="border-emerald-500/40 bg-emerald-500/5 shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Patient in Room
                    </CardTitle>
                    <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
                      In Consultation
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Consultation started at{" "}
                    {details.currentConsultation.consultStartedAt
                      ? new Date(details.currentConsultation.consultStartedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recently"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {canManageRoom ? (
                    <Button
                      onClick={() =>
                        handleUpdateStatus(
                          details.currentConsultation!.id,
                          "COMPLETED",
                          "Consultation marked as completed!"
                        )
                      }
                      disabled={isUpdatingStatus}
                      className="w-full gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <IconCircleCheck className="h-4 w-4" />
                      Complete Consultation
                    </Button>
                  ) : (
                    <div className="text-xs text-center py-1 text-muted-foreground font-medium">
                      Consultation in progress
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/80 border-dashed bg-muted/20">
                <CardContent className="p-8 text-center space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Doctor is currently idle. No patient in consultation.
                  </div>
                  {canManageRoom && (
                    <>
                      {details.checkedInQueue.length > 0 ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(
                              details.checkedInQueue[0]!.id,
                              "IN_CONSULTATION",
                              `Called patient ${details.checkedInQueue[0]!.patientInitials} into room!`
                            )
                          }
                          disabled={isUpdatingStatus}
                          className="gap-1.5 text-xs font-semibold"
                        >
                          <IconPlayerPlay className="h-3.5 w-3.5" />
                          Call Next Patient ({details.checkedInQueue[0]!.patientInitials})
                        </Button>
                      ) : details.upcomingBooked.length > 0 ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(
                              details.upcomingBooked[0]!.id,
                              "IN_CONSULTATION",
                              `Admitted upcoming patient ${details.upcomingBooked[0]!.patientInitials} into room!`
                            )
                          }
                          disabled={isUpdatingStatus}
                          className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <IconPlayerPlay className="h-3.5 w-3.5" />
                          Admit Booked Patient ({details.upcomingBooked[0]!.patientInitials})
                        </Button>
                      ) : null}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* LANE 2: Waiting Queue (Checked In) (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <IconUserCheck className="h-4 w-4 text-amber-500" />
                Waiting in Clinic ({details.checkedInQueue.length})
              </span>
            </div>

            {details.checkedInQueue.length === 0 ? (
              <Card className="border-border/80 border-dashed bg-muted/20">
                <CardContent className="p-8 text-center text-xs text-muted-foreground">
                  No checked-in patients currently in the waiting area.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {details.checkedInQueue.map((item, idx) => (
                  <Card key={item.id} className="border-border/80 shadow-xs">
                    <CardContent className="p-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                            #{item.queuePosition}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                              Patient {item.patientInitials}
                              {item.assistantSummary && (
                                <IconRobot className="h-3.5 w-3.5 text-primary" title="AI Assisted" />
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Wait: ~{item.estimatedWaitMinutes}m ({item.patientsAhead} ahead)
                            </div>
                          </div>
                        </div>
                        {renderUrgencyBadge(item.urgency)}
                      </div>

                      <div className="text-xs text-muted-foreground line-clamp-2 bg-muted/40 p-2 rounded-md">
                        {item.reason}
                      </div>

                      {canManageRoom && (
                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUpdateStatus(
                                item.id,
                                "IN_CONSULTATION",
                                `Called patient ${item.patientInitials} into room!`
                              )
                            }
                            disabled={isUpdatingStatus}
                            className="h-7 text-xs px-2.5 gap-1"
                          >
                            <IconPlayerPlay className="h-3.5 w-3.5 text-emerald-600" />
                            Call In
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* LANE 3: Upcoming Booked Appointments (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <IconClock className="h-4 w-4 text-sky-500" />
                Upcoming Bookings ({details.upcomingBooked.length})
              </span>
            </div>

            {details.upcomingBooked.length === 0 ? (
              <Card className="border-border/80 border-dashed bg-muted/20">
                <CardContent className="p-8 text-center text-xs text-muted-foreground">
                  No upcoming booked appointments for this doctor.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {details.upcomingBooked.map((item) => {
                  const slotDate = new Date(item.slotStartsAt);
                  const isToday = slotDate.toDateString() === new Date().toDateString();
                  const tomorrowDate = new Date();
                  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                  const isTomorrow = tomorrowDate.toDateString() === slotDate.toDateString();
                  const dateLabel = isToday
                    ? "Today"
                    : isTomorrow
                    ? "Tomorrow"
                    : slotDate.toLocaleDateString([], { month: "short", day: "numeric" });
                  const time = slotDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <Card key={item.id} className="border-border/80 shadow-xs">
                      <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-xs text-foreground">
                              Patient {item.patientInitials}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <IconClock className="h-3 w-3" />
                              <span>{dateLabel}, {time}</span>
                            </div>
                          </div>
                          {renderUrgencyBadge(item.urgency)}
                        </div>

                        <div className="text-xs text-muted-foreground truncate bg-muted/30 p-1.5 rounded-md">
                          {item.reason}
                        </div>

                        {canManageRoom ? (
                          <div className="flex items-center justify-between pt-1 gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(
                                  item.id,
                                  "NO_SHOW",
                                  `Marked patient ${item.patientInitials} as No-Show.`
                                )
                              }
                              disabled={isUpdatingStatus}
                              className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                            >
                              No-Show
                            </Button>

                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdateStatus(
                                    item.id,
                                    "CHECKED_IN",
                                    `Patient ${item.patientInitials} checked in! Added to waiting lobby.`
                                  )
                                }
                                disabled={isUpdatingStatus}
                                className="h-7 text-xs px-2.5 gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                              >
                                <IconUserCheck className="h-3.5 w-3.5" />
                                Check In
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateStatus(
                                    item.id,
                                    "IN_CONSULTATION",
                                    `Admitted patient ${item.patientInitials} directly to consultation room!`
                                  )
                                }
                                disabled={isUpdatingStatus}
                                className="h-7 text-xs px-2.5 gap-1 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 font-medium"
                              >
                                <IconPlayerPlay className="h-3 w-3" />
                                Admit
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground/70 italic pt-1">
                            Assigned to this doctor&apos;s consult room
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
