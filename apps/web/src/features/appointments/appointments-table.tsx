"use client";

import * as React from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/config";
import {
  IconCalendar,
  IconClock,
  IconStethoscope,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconArrowRight,
  IconTicket,
  IconRobot,
  IconRefresh,
  IconUser,
  IconAlertTriangle,
  IconHourglassLow,
  IconChecklist,
  IconSearch,
} from "@tabler/icons-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AppointmentItem, AppointmentStatusType, UrgencyLevelType } from "@/lib/appointments/types";
import { isAppointmentToday } from "@/lib/appointments/utils";
import { cancelAppointmentAction, rescheduleAppointmentAction } from "@/lib/appointments/actions";

interface RescheduleSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface AppointmentsTableProps {
  appointments: AppointmentItem[];
}

export function AppointmentsTable({ appointments }: AppointmentsTableProps) {
  const [tab, setTab] = React.useState<"upcoming" | "past">("upcoming");
  const [search, setSearch] = React.useState<string>("");

  // Cancel Dialog state
  const [cancelTarget, setCancelTarget] = React.useState<AppointmentItem | null>(null);
  const [cancelReason, setCancelReason] = React.useState<string>("");
  const [isCancelling, startCancelTransition] = React.useTransition();

  // Reschedule Dialog state
  const [rescheduleTarget, setRescheduleTarget] = React.useState<AppointmentItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = React.useState<string>("");
  const [minDate, setMinDate] = React.useState<string>("");

  React.useEffect(() => {
    setMinDate(new Date().toISOString().split("T")[0]);
  }, []);
  const [availableSlots, setAvailableSlots] = React.useState<RescheduleSlot[]>([]);
  const [selectedNewSlotId, setSelectedNewSlotId] = React.useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false);
  const [isRescheduling, startRescheduleTransition] = React.useTransition();

  // Filter lists
  const upcomingList = React.useMemo(() => {
    return appointments.filter(
      (a) =>
        a.status === "BOOKED" ||
        a.status === "CHECKED_IN" ||
        a.status === "IN_CONSULTATION"
    );
  }, [appointments]);

  const pastList = React.useMemo(() => {
    return appointments.filter(
      (a) =>
        a.status === "COMPLETED" ||
        a.status === "CANCELLED" ||
        a.status === "NO_SHOW"
    );
  }, [appointments]);

  const activeList = tab === "upcoming" ? upcomingList : pastList;

  const filteredList = React.useMemo(() => {
    if (!search.trim()) return activeList;
    const q = search.toLowerCase();
    return activeList.filter(
      (a) =>
        a.slot.doctor.specialty.toLowerCase().includes(q) ||
        a.slot.doctor.user.email.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q) ||
        (a.assistantSummary && a.assistantSummary.toLowerCase().includes(q))
    );
  }, [activeList, search]);

  // Fetch slots when reschedule dialog is opened or date changes
  const fetchDoctorSlotsForReschedule = React.useCallback(
    async (doctorId: string, date: string) => {
      setIsLoadingSlots(true);
      setSelectedNewSlotId(null);
      try {
        const startOfDay = new Date(`${date}T00:00:00.000Z`).toISOString();
        const endOfDay = new Date(`${date}T23:59:59.999Z`).toISOString();

        const res = await fetch(
          getApiUrl(`/slots/doctor/${doctorId}?from=${startOfDay}&to=${endOfDay}`)
        );
        if (res.ok) {
          const json = await res.json();
          const available = (json.data || []).filter(
            (s: RescheduleSlot) => s.status === "AVAILABLE"
          );
          setAvailableSlots(available);
        } else {
          setAvailableSlots([]);
        }
      } catch {
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    },
    []
  );

  const openRescheduleDialog = (appointment: AppointmentItem) => {
    setRescheduleTarget(appointment);
    const initialDate = new Date().toISOString().split("T")[0];
    setRescheduleDate(initialDate);
    fetchDoctorSlotsForReschedule(appointment.slot.doctorId, initialDate);
  };

  const handleDateChangeForReschedule = (newDate: string) => {
    setRescheduleDate(newDate);
    if (rescheduleTarget) {
      fetchDoctorSlotsForReschedule(rescheduleTarget.slot.doctorId, newDate);
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelTarget) return;

    const formData = new FormData();
    formData.set("appointmentId", cancelTarget.id);
    if (cancelReason.trim()) {
      formData.set("reason", cancelReason.trim());
    }

    startCancelTransition(async () => {
      const res = await cancelAppointmentAction(null, formData);
      if (!res.success) {
        toast.error(res.error || "Failed to cancel appointment");
        return;
      }

      toast.success("Appointment successfully cancelled.");
      setCancelTarget(null);
      setCancelReason("");
    });
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleTarget || !selectedNewSlotId) return;

    const formData = new FormData();
    formData.set("appointmentId", rescheduleTarget.id);
    formData.set("newSlotId", selectedNewSlotId);

    startRescheduleTransition(async () => {
      const res = await rescheduleAppointmentAction(null, formData);
      if (!res.success) {
        toast.error(res.error || "Failed to reschedule appointment");
        return;
      }

      toast.success("Appointment successfully rescheduled.");
      setRescheduleTarget(null);
      setSelectedNewSlotId(null);
    });
  };

  // Status renderer helper
  const renderStatusBadge = (status: AppointmentStatusType) => {
    switch (status) {
      case "BOOKED":
        return (
          <Badge variant="secondary" className="bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25 text-[11px] font-medium">
            Confirmed
          </Badge>
        );
      case "CHECKED_IN":
        return (
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[11px] font-semibold gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            In Waiting Area
          </Badge>
        );
      case "IN_CONSULTATION":
        return (
          <Badge variant="default" className="bg-emerald-600 text-white font-bold text-[11px] gap-1.5 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            In Consultation
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/5 text-[11px] font-medium">
            Completed
          </Badge>
        );
      case "CANCELLED":
        return <Badge variant="destructive" className="text-[11px] font-medium">Cancelled</Badge>;
      case "NO_SHOW":
        return <Badge variant="secondary" className="text-[11px] text-muted-foreground font-medium">No Show</Badge>;
      default:
        return <Badge variant="secondary" className="text-[11px]">{status}</Badge>;
    }
  };

  // Urgency badge renderer
  const renderUrgencyBadge = (urgency: UrgencyLevelType) => {
    switch (urgency) {
      case "EMERGENCY":
        return (
          <Badge variant="destructive" className="uppercase text-[10px] font-bold tracking-wider gap-1 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Emergency
          </Badge>
        );
      case "URGENT":
        return (
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[10px] uppercase font-bold tracking-wider">
            Urgent
          </Badge>
        );
      case "ROUTINE":
      default:
        return (
          <Badge variant="outline" className="text-[10px] uppercase font-medium border-border/80 text-muted-foreground tracking-wider">
            Routine
          </Badge>
        );
    }
  };

  // Date formatting helpers
  const formatSlotTime = (startsAt: string, endsAt: string) => {
    const start = new Date(startsAt);
    const end = new Date(endsAt);

    const dateStr = start.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const startTimeStr = start.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const endTimeStr = end.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return { dateStr, timeStr: `${startTimeStr} - ${endTimeStr}` };
  };

  return (
    <div className="space-y-6">
      {/* Search and Tab Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Tabs value={tab} onValueChange={(val) => setTab(val as "upcoming" | "past")}>
          <TabsList>
            <TabsTrigger value="upcoming" className="gap-2">
              <IconCalendar className="h-4 w-4" />
              Upcoming ({upcomingList.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              <IconChecklist className="h-4 w-4" />
              Past Visits ({pastList.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by doctor, specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <Button
            render={<Link href="/book" />}
            size="sm"
            className="gap-1.5 shrink-0"
          >
            <IconStethoscope className="h-4 w-4" />
            Book Slot
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <IconCalendar className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-base font-semibold">
                  {tab === "upcoming"
                    ? "No upcoming appointments"
                    : "No past appointment history"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {tab === "upcoming"
                    ? "You do not have any scheduled appointments right now. Book an appointment or chat with our AI assistant."
                    : "Completed, cancelled, or past consultation records will appear here."}
                </p>
              </div>
              {tab === "upcoming" && (
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    render={<Link href="/book" />}
                    size="sm"
                  >
                    Browse Doctors
                  </Button>
                  <Button
                    render={<Link href="/assistant" />}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                  >
                    <IconRobot className="h-4 w-4 text-primary" />
                    Ask AI Assistant
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor & Specialty</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Consultation Reason</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Live Queue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredList.map((appointment) => {
                  const { dateStr, timeStr } = formatSlotTime(
                    appointment.slot.startsAt,
                    appointment.slot.endsAt
                  );
                  const isToday = isAppointmentToday(appointment.slot.startsAt);
                  const canCancelOrReschedule = appointment.status === "BOOKED";

                  return (
                    <TableRow key={appointment.id} className={isToday ? "bg-primary/5" : ""}>
                      {/* Doctor Info */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-semibold text-xs">
                            <IconStethoscope className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-xs text-foreground flex items-center gap-1.5">
                              {appointment.slot.doctor.user.email.split("@")[0]}
                              {appointment.bookedVia === "ASSISTANT" && (
                                <span title="Booked with AI Assistant">
                                  <IconRobot className="h-3.5 w-3.5 text-primary shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {appointment.slot.doctor.specialty}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Date & Time */}
                      <TableCell>
                        <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          {dateStr}
                          {isToday && (
                            <Badge variant="default" className="text-[9px] px-1 py-0 uppercase">
                              Today
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <IconClock className="h-3 w-3" />
                          {timeStr}
                        </div>
                      </TableCell>

                      {/* Reason & Assistant Summary */}
                      <TableCell className="max-w-xs">
                        <div className="text-xs text-foreground truncate" title={appointment.reason}>
                          {appointment.reason}
                        </div>
                        {appointment.assistantSummary && (
                          <div
                            className="text-[11px] text-muted-foreground truncate italic flex items-center gap-1"
                            title={appointment.assistantSummary}
                          >
                            <span className="font-semibold text-primary not-italic text-[10px]">AI:</span>
                            {appointment.assistantSummary}
                          </div>
                        )}
                      </TableCell>

                      {/* Urgency */}
                      <TableCell>{renderUrgencyBadge(appointment.urgency)}</TableCell>

                      {/* Status */}
                      <TableCell>{renderStatusBadge(appointment.status)}</TableCell>

                      {/* Live Queue Turn Tracker */}
                      <TableCell>
                        {appointment.status === "BOOKED" || appointment.status === "CHECKED_IN" ? (
                          <Button
                            render={<Link href={`/track/${appointment.trackingToken}`} />}
                            variant={isToday ? "default" : "outline"}
                            size="sm"
                            className="h-7 text-[11px] gap-1 px-2.5 shadow-xs"
                          >
                            <IconTicket className="h-3.5 w-3.5" />
                            {isToday ? "Live Turn" : "Track Ticket"}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Row Actions */}
                      <TableCell className="text-right">
                        {canCancelOrReschedule ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2.5"
                              onClick={() => openRescheduleDialog(appointment)}
                            >
                              Reschedule
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setCancelTarget(appointment);
                                setCancelReason("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="h-5 w-5" />
              Cancel Appointment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? The doctor&apos;s slot will be released
              and may be offered to waiting patients immediately.
            </DialogDescription>
          </DialogHeader>

          {cancelTarget && (
            <div className="rounded-lg border border-border/80 bg-muted/40 p-3 space-y-1.5 text-xs">
              <div className="font-semibold text-foreground">
                Dr. {cancelTarget.slot.doctor.user.email.split("@")[0]} ({cancelTarget.slot.doctor.specialty})
              </div>
              <div className="text-muted-foreground flex items-center gap-1.5">
                <IconCalendar className="h-3.5 w-3.5" />
                {formatSlotTime(cancelTarget.slot.startsAt, cancelTarget.slot.endsAt).dateStr} at{" "}
                {formatSlotTime(cancelTarget.slot.startsAt, cancelTarget.slot.endsAt).timeStr}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="cancelReason" className="text-xs font-medium text-foreground">
              Reason for cancellation (optional):
            </label>
            <Input
              id="cancelReason"
              placeholder="e.g., Schedule conflict, feeling better"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="text-xs"
              maxLength={300}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelTarget(null)}
              disabled={isCancelling}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="gap-1.5"
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleTarget} onOpenChange={(open) => !open && setRescheduleTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconRefresh className="h-5 w-5 text-primary" />
              Reschedule Appointment
            </DialogTitle>
            <DialogDescription>
              Choose a new available slot for Dr.{" "}
              {rescheduleTarget?.slot.doctor.user.email.split("@")[0]}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Date Picker Input */}
            <div className="space-y-1.5">
              <label htmlFor="rescheduleDate" className="text-xs font-semibold text-foreground">
                Select Consultation Date:
              </label>
              <Input
                id="rescheduleDate"
                type="date"
                min={minDate || undefined}
                value={rescheduleDate}
                onChange={(e) => handleDateChangeForReschedule(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Available Slots Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Available Slots</span>
                {isLoadingSlots && (
                  <span className="text-[11px] text-muted-foreground animate-pulse">Loading slots...</span>
                )}
              </div>

              {isLoadingSlots ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-9 rounded-md bg-muted animate-pulse" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  No free slots available on this date. Please pick another date.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {availableSlots.map((slot) => {
                    const start = new Date(slot.startTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    });
                    const isSelected = selectedNewSlotId === slot.id;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedNewSlotId(slot.id)}
                        className={`flex items-center justify-center rounded-lg border py-2 px-3 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-border/60 bg-background hover:bg-muted text-foreground"
                        }`}
                      >
                        <IconClock className="mr-1.5 h-3.5 w-3.5 opacity-70" />
                        {start}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRescheduleTarget(null)}
              disabled={isRescheduling}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmReschedule}
              disabled={!selectedNewSlotId || isRescheduling}
              className="gap-1.5"
            >
              {isRescheduling ? "Rescheduling..." : "Confirm New Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
