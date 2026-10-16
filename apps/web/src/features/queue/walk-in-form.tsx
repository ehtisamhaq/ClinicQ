"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconWalk,
  IconStethoscope,
  IconClock,
  IconMail,
  IconPhone,
  IconUserCheck,
  IconArrowRight,
  IconCheck,
  IconAlertCircle,
  IconLoader,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { DoctorCatalogItem, SlotItem } from "@/lib/catalog/queries";
import { bookWalkInAction } from "@/lib/queue/actions";

interface WalkInFormProps {
  doctors: DoctorCatalogItem[];
}

export function WalkInForm({ doctors }: WalkInFormProps) {
  const router = useRouter();

  const [patientEmail, setPatientEmail] = React.useState("");
  const [patientPhone, setPatientPhone] = React.useState("");
  const [preferredLanguage, setPreferredLanguage] = React.useState<"en" | "bn">("en");
  const [selectedDoctorId, setSelectedDoctorId] = React.useState<string>(doctors[0]?.id || "");
  const [reason, setReason] = React.useState("");
  const [autoCheckIn, setAutoCheckIn] = React.useState(true);

  // Slots for the selected doctor today
  const [slots, setSlots] = React.useState<SlotItem[]>([]);
  const [selectedSlotId, setSelectedSlotId] = React.useState<string>("");
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false);

  const [isPending, startTransition] = React.useTransition();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Fetch slots for selected doctor today
  const fetchTodaySlots = React.useCallback(async (doctorId: string) => {
    if (!doctorId) return;
    setIsLoadingSlots(true);
    setSelectedSlotId("");
    try {
      const today = new Date().toISOString().split("T")[0];
      const startOfDay = new Date(`${today}T00:00:00.000Z`).toISOString();
      const endOfDay = new Date(`${today}T23:59:59.999Z`).toISOString();

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
      const res = await fetch(
        `${apiUrl}/slots/doctor/${doctorId}?from=${startOfDay}&to=${endOfDay}`
      );
      if (res.ok) {
        const json = await res.json();
        const available = (json.data || []).filter((s: SlotItem) => s.status === "AVAILABLE");
        setSlots(available);
        if (available[0]) {
          setSelectedSlotId(available[0].id);
        }
      } else {
        setSlots([]);
      }
    } catch {
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedDoctorId) {
      fetchTodaySlots(selectedDoctorId);
    }
  }, [selectedDoctorId, fetchTodaySlots]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedSlotId) {
      setErrorMessage("Please select an available appointment slot.");
      return;
    }

    startTransition(async () => {
      const res = await bookWalkInAction({
        patientEmail,
        patientPhone: patientPhone || undefined,
        preferredLanguage,
        doctorId: selectedDoctorId,
        slotId: selectedSlotId,
        reason,
        autoCheckIn,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Walk-in booking failed");
        toast.error(res.error || "Walk-in booking failed");
        return;
      }

      toast.success(res.message || "Walk-in patient registered successfully!");
      router.push("/queue");
      router.refresh();
    });
  };

  return (
    <Card className="max-w-2xl mx-auto border-border/80 shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconWalk className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-heading font-semibold">
            Walk-in Patient Check-In
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Directly register an on-site walk-in patient, allocate today&apos;s available slot, and place them immediately into the doctor&apos;s queue.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <IconAlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Patient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="patientEmail" className="text-xs">
                Patient Email Address *
              </Label>
              <div className="relative">
                <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="patientEmail"
                  type="email"
                  required
                  placeholder="patient@example.com"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="patientPhone" className="text-xs">
                Contact Phone (optional)
              </Label>
              <div className="relative">
                <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="patientPhone"
                  type="tel"
                  placeholder="+880 1711-000000"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Doctor Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="doctorSelect" className="text-xs">
              Select Specialist Doctor *
            </Label>
            <div className="relative">
              <IconStethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                id="doctorSelect"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id} className="bg-background text-foreground">
                    Dr. {doc.name} — {doc.specialty} (Fee: ৳{doc.consultationFee})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Available Slot Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Today&apos;s Available Slots *</Label>
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
            ) : slots.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No slots currently available for this doctor today.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {slots.map((slot) => {
                  const time = new Date(slot.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isSelected = selectedSlotId === slot.id;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`flex items-center justify-center rounded-lg border py-2 px-3 text-xs font-medium transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border/60 bg-background hover:bg-muted text-foreground"
                      }`}
                    >
                      <IconClock className="mr-1.5 h-3.5 w-3.5 opacity-70" />
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reason for Visit */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs">
              Reason for Consultation / Triage Note *
            </Label>
            <Input
              id="reason"
              required
              minLength={3}
              placeholder="e.g., Acute migraine and dizziness since morning"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Auto Check-In Toggle */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <IconUserCheck className="h-4 w-4 text-amber-600" />
                Auto Check-in Immediately
              </div>
              <p className="text-[11px] text-muted-foreground">
                Place this patient directly into the live waiting queue as arrived.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoCheckIn}
              onChange={(e) => setAutoCheckIn(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border/60 pt-4">
          <Button
            render={<Link href="/queue" />}
            variant="outline"
            size="sm"
            type="button"
          >
            Back to Queue
          </Button>

          <Button
            type="submit"
            disabled={isPending || !selectedSlotId || !patientEmail}
            size="sm"
            className="gap-2 font-semibold"
          >
            {isPending ? (
              <>
                <IconLoader className="h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                Confirm Walk-in
                <IconArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
