"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiUrl } from "@/lib/config";
import {
  IconCalendar,
  IconClock,
  IconCheck,
  IconStethoscope,
  IconAlertCircle,
  IconLoader,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { DoctorCatalogItem } from "@/lib/catalog/queries";
import type { DoctorScheduleItem } from "@/lib/admin/types";
import { updateDoctorScheduleAction } from "@/lib/admin/actions";

const WEEKDAYS = [
  { day: 0, label: "Sunday" },
  { day: 1, label: "Monday" },
  { day: 2, label: "Tuesday" },
  { day: 3, label: "Wednesday" },
  { day: 4, label: "Thursday" },
  { day: 5, label: "Friday" },
  { day: 6, label: "Saturday" },
];

interface SchedulesManagerProps {
  doctors: DoctorCatalogItem[];
  initialDoctorId?: string;
  initialSchedules: DoctorScheduleItem[];
}

export function SchedulesManager({
  doctors,
  initialDoctorId,
  initialSchedules,
}: SchedulesManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryDocId = searchParams.get("doctorId") || initialDoctorId || doctors[0]?.id || "";

  const [selectedDoctorId, setSelectedDoctorId] = React.useState<string>(queryDocId);

  // Weekly schedule rows map: day -> { enabled, startTime, endTime, slotMinutes }
  const [scheduleState, setScheduleState] = React.useState<
    Record<number, { enabled: boolean; startTime: string; endTime: string; slotMinutes: number }>
  >(() => {
    const map: Record<number, { enabled: boolean; startTime: string; endTime: string; slotMinutes: number }> = {};
    WEEKDAYS.forEach((w) => {
      const existing = initialSchedules.find((s) => s.weekday === w.day);
      map[w.day] = {
        enabled: !!existing,
        startTime: existing?.startTime || "09:00",
        endTime: existing?.endTime || "17:00",
        slotMinutes: existing?.slotMinutes || 15,
      };
    });
    return map;
  });

  const [isLoadingSchedules, setIsLoadingSchedules] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  // Fetch schedules when doctor changes
  const handleDoctorChange = async (docId: string) => {
    setSelectedDoctorId(docId);
    setIsLoadingSchedules(true);

    try {
      const res = await fetch(getApiUrl(`/doctors/${docId}/schedules`), { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const items: DoctorScheduleItem[] = json.data || [];

        const newMap: Record<number, { enabled: boolean; startTime: string; endTime: string; slotMinutes: number }> = {};
        WEEKDAYS.forEach((w) => {
          const found = items.find((s) => s.weekday === w.day);
          newMap[w.day] = {
            enabled: !!found,
            startTime: found?.startTime || "09:00",
            endTime: found?.endTime || "17:00",
            slotMinutes: found?.slotMinutes || 15,
          };
        });
        setScheduleState(newMap);
      }
    } catch {
      toast.error("Could not fetch schedules for doctor");
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const handleToggleDay = (day: number) => {
    setScheduleState((prev) => ({
      ...prev,
      [day]: {
        ...prev[day]!,
        enabled: !prev[day]!.enabled,
      },
    }));
  };

  const handleFieldChange = (
    day: number,
    field: "startTime" | "endTime" | "slotMinutes",
    value: string | number
  ) => {
    setScheduleState((prev) => ({
      ...prev,
      [day]: {
        ...prev[day]!,
        [field]: value,
      },
    }));
  };

  const handleSaveSchedules = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) return;

    // Filter only enabled days
    const activeSchedules: DoctorScheduleItem[] = [];
    Object.entries(scheduleState).forEach(([dayStr, config]) => {
      if (config.enabled) {
        activeSchedules.push({
          weekday: Number(dayStr),
          startTime: config.startTime,
          endTime: config.endTime,
          slotMinutes: Number(config.slotMinutes),
        });
      }
    });

    startTransition(async () => {
      const res = await updateDoctorScheduleAction({
        doctorId: selectedDoctorId,
        schedules: activeSchedules,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to save weekly schedules");
        return;
      }

      toast.success("Weekly consultation schedules updated successfully!");
      router.refresh();
    });
  };

  return (
    <Card className="border-border/80 shadow-md max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconCalendar className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-heading font-semibold">
            Weekly Consultation Schedule Manager
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Configure weekly availability windows. ClinicQ automatically generates conflict-free booking slots based on these windows.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSaveSchedules}>
        <CardContent className="space-y-6">
          {/* Doctor Selector */}
          <div className="space-y-1.5 max-w-md">
            <Label htmlFor="doctorSelect" className="text-xs font-semibold">
              Select Specialist Doctor:
            </Label>
            <div className="relative">
              <IconStethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                id="doctorSelect"
                value={selectedDoctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id} className="bg-background text-foreground">
                    Dr. {doc.name} — {doc.specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule Table / Rows */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Weekly Days & Time Windows
              </span>
              {isLoadingSchedules && (
                <span className="text-[11px] text-muted-foreground animate-pulse">Loading...</span>
              )}
            </div>

            <div className="rounded-xl border border-border/80 divide-y divide-border/60 overflow-hidden bg-card">
              {WEEKDAYS.map((w) => {
                const config = scheduleState[w.day]!;

                return (
                  <div
                    key={w.day}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-3 transition-colors ${
                      config.enabled ? "bg-background" : "bg-muted/20 opacity-60"
                    }`}
                  >
                    {/* Day Toggle */}
                    <div className="flex items-center gap-3 min-w-[120px]">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={() => handleToggleDay(w.day)}
                        className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-foreground">
                        {w.label}
                      </span>
                    </div>

                    {/* Time Window Settings */}
                    {config.enabled ? (
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[11px] text-muted-foreground">From:</Label>
                          <Input
                            type="time"
                            value={config.startTime}
                            onChange={(e) => handleFieldChange(w.day, "startTime", e.target.value)}
                            className="h-8 w-28 text-xs"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Label className="text-[11px] text-muted-foreground">To:</Label>
                          <Input
                            type="time"
                            value={config.endTime}
                            onChange={(e) => handleFieldChange(w.day, "endTime", e.target.value)}
                            className="h-8 w-28 text-xs"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Label className="text-[11px] text-muted-foreground">Slot (min):</Label>
                          <Input
                            type="number"
                            min={5}
                            max={60}
                            step={5}
                            value={config.slotMinutes}
                            onChange={(e) =>
                              handleFieldChange(w.day, "slotMinutes", Number(e.target.value))
                            }
                            className="h-8 w-20 text-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        No clinic sessions scheduled on this day.
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border/60 pt-4">
          <p className="text-[11px] text-muted-foreground">
            Changes will take effect immediately for upcoming patient bookings.
          </p>

          <Button
            type="submit"
            disabled={isPending || isLoadingSchedules}
            size="sm"
            className="gap-2 font-semibold"
          >
            {isPending ? (
              <>
                <IconLoader className="h-4 w-4 animate-spin" />
                Saving Schedules...
              </>
            ) : (
              <>
                <IconCheck className="h-4 w-4" />
                Save Weekly Schedule
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
