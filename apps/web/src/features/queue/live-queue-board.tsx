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
import { updateQueueStatusAction } from "@/lib/queue/actions";
import { useQueueSocket } from "@/lib/socket/use-queue-socket";

interface LiveQueueBoardProps {
  initialSummaries: DoctorQueueSummary[];
  initialSelectedDoctorDetails: DoctorQueueDetails | null;
}

export function LiveQueueBoard({
  initialSummaries,
  initialSelectedDoctorDetails,
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

  // Fetch full details for the currently selected doctor
  const fetchDoctorDetails = React.useCallback(async (docId: string) => {
    if (!docId) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
      const res = await fetch(`${apiUrl}/queue/doctor/${docId}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setDetails(json.data || null);
      }
    } catch {
      // Keep existing details if network flickers
    }
  }, []);

  // Refresh summaries and details on socket update or periodic poll
  const handleLiveRefresh = React.useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
      const res = await fetch(`${apiUrl}/queue/clinic`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data) setSummaries(json.data);
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
        return <Badge variant="destructive" className="text-[10px] uppercase">Emergency</Badge>;
      case "URGENT":
        return <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 text-[10px] uppercase">Urgent</Badge>;
      case "ROUTINE":
      default:
        return <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase">Routine</Badge>;
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
            const docName = doc.doctorEmail.split("@")[0];

            return (
              <button
                key={doc.doctorId}
                type="button"
                onClick={() => handleSelectDoctor(doc.doctorId)}
                className={`relative flex flex-col p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                    : "border-border/80 bg-card hover:bg-muted/50 text-foreground"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="truncate">
                    <div className="font-semibold text-xs text-foreground truncate">
                      Dr. {docName}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {doc.specialty}
                    </div>
                  </div>
                  {doc.inConsultationCount > 0 ? (
                    <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-emerald-600 text-white animate-pulse shrink-0">
                      In Room
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 text-muted-foreground shrink-0">
                      Idle
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <IconUsers className="h-3.5 w-3.5 text-primary" />
                    <span>
                      <strong className="text-foreground">{doc.checkedInCount}</strong> in line
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    ~{doc.estimatedTotalWaitMinutes}m wait
                  </div>
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
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/80 border-dashed bg-muted/20">
                <CardContent className="p-8 text-center space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Doctor is currently idle. No patient in consultation.
                  </div>
                  {details.checkedInQueue.length > 0 && (
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* LANE 3: Scheduled Today (Booked) (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <IconClock className="h-4 w-4 text-sky-500" />
                Scheduled Today ({details.upcomingBooked.length})
              </span>
            </div>

            {details.upcomingBooked.length === 0 ? (
              <Card className="border-border/80 border-dashed bg-muted/20">
                <CardContent className="p-8 text-center text-xs text-muted-foreground">
                  No further booked appointments scheduled for today.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {details.upcomingBooked.map((item) => {
                  const time = new Date(item.slotStartsAt).toLocaleTimeString([], {
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
                              Slot: {time}
                            </div>
                          </div>
                          {renderUrgencyBadge(item.urgency)}
                        </div>

                        <div className="text-xs text-muted-foreground truncate bg-muted/30 p-1.5 rounded-md">
                          {item.reason}
                        </div>

                        <div className="flex items-center justify-between pt-1">
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

                          <Button
                            size="sm"
                            onClick={() =>
                              handleUpdateStatus(
                                item.id,
                                "CHECKED_IN",
                                `Patient ${item.patientInitials} checked in! Added to queue.`
                              )
                            }
                            disabled={isUpdatingStatus}
                            className="h-7 text-xs px-3 gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            <IconUserCheck className="h-3.5 w-3.5" />
                            Check In
                          </Button>
                        </div>
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
