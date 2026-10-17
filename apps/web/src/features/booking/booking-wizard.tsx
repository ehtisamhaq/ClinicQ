"use client";

import * as React from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/config";
import {
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconLoader,
  IconSearch,
  IconStethoscope,
  IconMapPin,
  IconLanguage,
  IconArrowRight,
  IconRefresh,
  IconTicket,
  IconHourglass,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { bookManualAppointmentAction, type BookActionResult } from "@/lib/booking/actions";
import { joinWaitlistAction } from "@/lib/waitlist/actions";
import type { DoctorCatalogItem, SlotItem } from "@/lib/catalog/queries";

export interface BookingWizardProps {
  specialties: string[];
  initialDoctors: DoctorCatalogItem[];
  user?: { id: string; name: string; role: string } | null;
}

export function BookingWizard({
  specialties,
  initialDoctors,
  user,
}: BookingWizardProps) {
  // Filters
  const [selectedSpecialty, setSelectedSpecialty] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [genderFilter, setGenderFilter] = React.useState<string>("ALL");
  const [maxFeeFilter, setMaxFeeFilter] = React.useState<number>(3000);

  // Selection state
  const [selectedDoctor, setSelectedDoctor] = React.useState<DoctorCatalogItem | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string>("");

  React.useEffect(() => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }, []);
  const [selectedSlot, setSelectedSlot] = React.useState<SlotItem | null>(null);
  const [reason, setReason] = React.useState<string>("");

  // Slot fetching state
  const [slots, setSlots] = React.useState<SlotItem[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState<boolean>(false);
  const [slotError, setSlotError] = React.useState<string | null>(null);

  // Booking submission state
  const [isPending, startTransition] = React.useTransition();
  const [bookingResult, setBookingResult] = React.useState<BookActionResult | null>(null);
  const [isJoiningWaitlist, startWaitlistTransition] = React.useTransition();

  const handleJoinWaitlist = (doctorId: string) => {
    if (!user) {
      toast.error("Please sign in to join the doctor's priority waitlist");
      return;
    }
    startWaitlistTransition(async () => {
      const res = await joinWaitlistAction(doctorId);
      if (res.success) {
        toast.success(res.message || "Added to priority waitlist!");
      } else {
        toast.error(res.error || "Failed to join waitlist");
      }
    });
  };

  // Generate next 7 selectable dates
  const nextDates = React.useMemo(() => {
    const dates: Array<{ dateString: string; label: string; dayName: string }> = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dateString = d.toISOString().split("T")[0];
      const isToday = i === 0;
      const isTomorrow = i === 1;
      const dayName = isToday ? "Today" : isTomorrow ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dates.push({ dateString, label, dayName });
    }
    return dates;
  }, []);

  // Filter doctors
  const filteredDoctors = React.useMemo(() => {
    return initialDoctors.filter((doc) => {
      if (selectedSpecialty !== "ALL" && doc.specialty !== selectedSpecialty) return false;
      if (genderFilter !== "ALL" && (doc.gender || "").toUpperCase() !== genderFilter.toUpperCase()) return false;
      if (Number(doc.consultationFee) > maxFeeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (doc.name || "").toLowerCase().includes(q);
        const matchesSpecialty = (doc.specialty || "").toLowerCase().includes(q);
        const matchesBio = doc.bio?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesSpecialty && !matchesBio) return false;
      }
      return true;
    });
  }, [initialDoctors, selectedSpecialty, genderFilter, maxFeeFilter, searchQuery]);

  // Fetch slots whenever selected doctor or date changes
  const fetchSlots = React.useCallback(async (doctorId: string, date: string) => {
    setIsLoadingSlots(true);
    setSlotError(null);
    setSelectedSlot(null);

    try {
      const startOfDay = new Date(`${date}T00:00:00.000Z`).toISOString();
      const endOfDay = new Date(`${date}T23:59:59.999Z`).toISOString();

      const res = await fetch(
        `/api/v1/slots/doctor/${doctorId}?from=${startOfDay}&to=${endOfDay}`
      ).catch(() => null);

      if (!res || !res.ok) {
        // Fallback directly to backend URL if relative route fails
        const fallbackRes = await fetch(
          getApiUrl(`/slots/doctor/${doctorId}?from=${startOfDay}&to=${endOfDay}`)
        );
        const json = await fallbackRes.json();
        const rawList = Array.isArray(json?.data) ? json.data : [];
        const available = rawList.map((s: any) => ({
          ...s,
          startTime: s.startsAt || s.startTime,
          endTime: s.endsAt || s.endTime,
          startsAt: s.startsAt || s.startTime,
          endsAt: s.endsAt || s.endTime,
        })).filter((s: SlotItem) => s.status === "AVAILABLE");
        setSlots(available);
      } else {
        const json = await res.json();
        const rawList = Array.isArray(json?.data) ? json.data : [];
        const available = rawList.map((s: any) => ({
          ...s,
          startTime: s.startsAt || s.startTime,
          endTime: s.endsAt || s.endTime,
          startsAt: s.startsAt || s.startTime,
          endsAt: s.endsAt || s.endTime,
        })).filter((s: SlotItem) => s.status === "AVAILABLE");
        setSlots(available);
      }
    } catch {
      setSlotError("Could not load slots for this date. Please try another day.");
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  const handleSelectDoctor = (doctor: DoctorCatalogItem) => {
    setSelectedDoctor(doctor);
    fetchSlots(doctor.id, selectedDate);
  };

  const handleSelectDate = (dateString: string) => {
    setSelectedDate(dateString);
    if (selectedDoctor) {
      fetchSlots(selectedDoctor.id, dateString);
    }
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedDoctor) return;

    if (!user) {
      toast.error("Please sign in to confirm your appointment");
      return;
    }

    startTransition(async () => {
      const res = await bookManualAppointmentAction({
        slotId: selectedSlot.id,
        reason: reason.trim() || "Routine medical consultation",
        doctorId: selectedDoctor.id,
        dateString: selectedDate,
      });

      setBookingResult(res);

      if (res.conflict) {
        toast.error("This slot was just taken by another patient!");
        // Refresh available slots immediately
        fetchSlots(selectedDoctor.id, selectedDate);
        return;
      }

      if (!res.success) {
        toast.error(res.error || "Failed to book appointment");
        return;
      }

      toast.success("Appointment booked successfully!");
    });
  };

  // If appointment booked successfully, show success receipt card
  if (bookingResult?.success && bookingResult.appointment) {
    const appt = bookingResult.appointment;
    const startTime = new Date(appt.slot.startsAt).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateFormatted = new Date(appt.slot.startsAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <div className="mx-auto max-w-xl py-12 px-4">
        <Card className="border-emerald-500/40 bg-card shadow-lg overflow-hidden">
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md mb-3">
              <IconCheck className="h-8 w-8 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Appointment Confirmed!</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Your consultation is confirmed with zero double-booking risk.
            </p>
          </div>

          <CardContent className="space-y-4 p-6">
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Doctor</span>
                <span className="text-sm font-semibold text-foreground">{appt.slot.doctor?.name || "Doctor"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Specialty</span>
                <Badge variant="outline">{appt.slot.doctor.specialty}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Date & Time</span>
                <span className="text-sm font-medium text-foreground">
                  {dateFormatted} at {startTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Fee</span>
                <span className="text-sm font-semibold text-foreground">
                  ৳{appt.slot.doctor.consultationFee} BDT
                </span>
              </div>
            </div>

            {/* Public Tracking Token Box */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
                <IconTicket className="h-4 w-4" />
                Live Queue Tracking Ticket
              </div>
              <p className="text-xs text-muted-foreground">
                You can track your turn without logging in on the appointment day:
              </p>
              <Link
                href={`/track/${appt.trackingToken}`}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-primary underline underline-offset-4 hover:opacity-80 break-all"
              >
                /track/{appt.trackingToken}
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2.5 p-6 pt-0">
            <Link href={`/track/${appt.trackingToken}`} className="w-full sm:flex-1">
              <Button className="w-full gap-2 text-xs">
                <IconTicket className="h-4 w-4" />
                Open Live Queue Tracker
              </Button>
            </Link>
            <Link href="/appointments" className="w-full sm:flex-1">
              <Button variant="outline" className="w-full text-xs">
                View My Appointments
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search and Filters Header */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-5 backdrop-blur-sm shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search doctor by name or symptom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Genders</option>
              <option value="MALE">Male Doctors</option>
              <option value="FEMALE">Female Doctors</option>
            </select>

            <select
              value={maxFeeFilter}
              onChange={(e) => setMaxFeeFilter(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value={3000}>Max Fee: Any</option>
              <option value={1000}>Max ৳1,000</option>
              <option value={1500}>Max ৳1,500</option>
              <option value={2000}>Max ৳2,000</option>
            </select>
          </div>
        </div>

        {/* Specialty Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <Button
            variant={selectedSpecialty === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSpecialty("ALL")}
            className="text-xs shrink-0 rounded-full"
          >
            All Specialties
          </Button>
          {specialties.map((spec) => (
            <Button
              key={spec}
              variant={selectedSpecialty === spec ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSpecialty(spec)}
              className="text-xs shrink-0 rounded-full"
            >
              {spec}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Grid: Doctors List (Left) and Slot Booking Picker (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Doctors Catalog */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Available Doctors ({filteredDoctors.length})
            </h2>
            <span className="text-xs text-muted-foreground">Select a doctor to view time slots</span>
          </div>

          {filteredDoctors.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <IconStethoscope className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
              <p className="text-sm font-medium text-foreground">No doctors match your filter</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try resetting your specialty or fee filters to see more results.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSpecialty("ALL");
                  setGenderFilter("ALL");
                  setMaxFeeFilter(3000);
                  setSearchQuery("");
                }}
                className="mt-4 text-xs"
              >
                Reset Filters
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredDoctors.map((doc) => {
                const isSelected = selectedDoctor?.id === doc.id;
                const docName = doc.name || "Doctor";
                const cleanInitial = docName.replace(/^Dr\.\s*/i, "").charAt(0).toUpperCase() || "D";
                const qualificationsText = (Array.isArray(doc.qualifications) && doc.qualifications.length > 0
                  ? doc.qualifications
                  : ["MBBS", "FCPS"]
                ).join(", ");
                const expYears = typeof doc.experienceYears === "number" ? doc.experienceYears : 10;
                const languagesText = (Array.isArray(doc.languages) && doc.languages.length > 0
                  ? doc.languages
                  : ["English", "Bengali"]
                ).join(", ");

                return (
                  <Card
                    key={doc.id}
                    onClick={() => handleSelectDoctor(doc)}
                    className={`cursor-pointer transition-all border ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 bg-card shadow-md"
                        : "border-border/80 hover:border-border hover:shadow-xs bg-card/60"
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base shadow-xs">
                          {cleanInitial}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base text-foreground leading-tight">
                              {docName}
                            </h3>
                            <Badge variant="secondary" className="text-[10px] px-2 py-0">
                              {doc.specialty}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {qualificationsText} • {expYears}+ years exp
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                            {doc.roomNumber && (
                              <span className="flex items-center gap-1">
                                <IconMapPin className="h-3.5 w-3.5" />
                                Room {doc.roomNumber}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <IconLanguage className="h-3.5 w-3.5" />
                              {languagesText}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                        <div className="text-right">
                          <span className="text-[11px] text-muted-foreground uppercase font-medium">Fee</span>
                          <div className="text-base font-bold text-primary">
                            ৳{doc.consultationFee} <span className="text-xs font-normal text-muted-foreground">BDT</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className="text-xs gap-1"
                        >
                          {isSelected ? (
                            <>
                              <IconCheck className="h-3.5 w-3.5" />
                              Selected
                            </>
                          ) : (
                            <>
                              Select Slots
                              <IconArrowRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Date & Slot Picker Panel */}
        <div className="lg:col-span-5 sticky top-20">
          <Card className="border-border/80 shadow-md">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Select Date & Time</CardTitle>
                  <CardDescription className="text-xs">
                    {selectedDoctor ? (selectedDoctor.name || "Doctor") : "Choose a doctor from the left"}
                  </CardDescription>
                </div>
                {selectedDoctor && (
                  <Badge variant="outline" className="text-xs">
                    ৳{selectedDoctor.consultationFee}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-5">
              {/* Date Strip */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  1. Choose Date
                </span>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                  {nextDates.map(({ dateString, label, dayName }) => {
                    const isDateSelected = selectedDate === dateString;
                    return (
                      <button
                        key={dateString}
                        type="button"
                        onClick={() => handleSelectDate(dateString)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                          isDateSelected
                            ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "border-border/60 bg-background hover:bg-muted text-foreground"
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-wider opacity-80">{dayName}</span>
                        <span className="text-xs font-bold mt-0.5">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    2. Available Time Slots
                  </span>
                  {selectedDoctor && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => fetchSlots(selectedDoctor.id, selectedDate)}
                      title="Refresh slots"
                    >
                      <IconRefresh className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {!selectedDoctor ? (
                  <div className="p-6 text-center border rounded-xl border-dashed bg-muted/20 text-xs text-muted-foreground">
                    Select a doctor from the catalog to see available times.
                  </div>
                ) : isLoadingSlots ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                    <IconLoader className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Checking live schedule...</span>
                  </div>
                ) : slotError ? (
                  <div className="p-4 text-center rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                    {slotError}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-6 text-center border rounded-xl border-dashed bg-muted/20 space-y-3">
                    <div className="space-y-1">
                      <IconAlertCircle className="mx-auto h-6 w-6 text-amber-500 mb-1" />
                      <p className="text-xs font-medium text-foreground">No available slots for this date</p>
                      <p className="text-[11px] text-muted-foreground">
                        {(selectedDoctor.name || "Doctor").replace(/^Dr\.\s*/i, "")} has no open turns on this day. Join the waitlist to be offered an opening automatically!
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                      disabled={isJoiningWaitlist}
                      onClick={() => handleJoinWaitlist(selectedDoctor.id)}
                    >
                      {isJoiningWaitlist ? (
                        <IconLoader className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <IconHourglass className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      Join Priority Waitlist
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {slots.map((slot) => {
                      const isSlotSelected = selectedSlot?.id === slot.id;
                      const rawTime = slot.startsAt || slot.startTime;
                      const dateObj = rawTime ? new Date(rawTime) : null;
                      const timeLabel = dateObj && !isNaN(dateObj.getTime())
                        ? dateObj.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "--:--";
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                            isSlotSelected
                              ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "border-border/70 bg-card hover:bg-muted text-foreground"
                          }`}
                        >
                          <IconClock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          <span>{timeLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reason for Visit Form */}
              {selectedSlot && (
                <form onSubmit={handleConfirmBooking} className="space-y-4 pt-2 border-t border-border/50">
                  <div className="space-y-1.5">
                    <label htmlFor="reason" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      3. Reason for Consultation
                    </label>
                    <Input
                      id="reason"
                      placeholder="e.g., Follow-up on blood pressure, fever, back pain..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      minLength={3}
                      className="text-xs"
                    />
                  </div>

                  {!user ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center space-y-2">
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        Please sign in to complete your booking.
                      </p>
                      <Link href={`/login?from=/book`}>
                        <Button size="sm" className="w-full text-xs">
                          Sign In to Book
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full gap-2 text-xs font-semibold shadow-md"
                    >
                      {isPending ? (
                        <>
                          <IconLoader className="h-4 w-4 animate-spin" />
                          Securing Slot...
                        </>
                      ) : (
                        <>
                          Confirm Booking (৳{selectedDoctor?.consultationFee} BDT)
                          <IconCheck className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
