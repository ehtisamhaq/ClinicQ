"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconHourglass,
  IconStethoscope,
  IconCalendar,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconLoader,
} from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WaitlistEntryItem } from "@/lib/waitlist/types";
import { leaveWaitlistAction } from "@/lib/waitlist/actions";

interface WaitlistSectionProps {
  entries: WaitlistEntryItem[];
}

export function WaitlistSection({ entries }: WaitlistSectionProps) {
  const [leavingId, setLeavingId] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  const handleLeave = (id: string) => {
    setLeavingId(id);
    startTransition(async () => {
      const result = await leaveWaitlistAction(id);
      if (result.success) {
        toast.success(result.message || "Removed from waitlist");
      } else {
        toast.error(result.error || "Failed to leave waitlist");
      }
      setLeavingId(null);
    });
  };

  return (
    <Card className="border-amber-500/30 bg-amber-500/5 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <IconHourglass className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Priority Waitlist ({entries.length})</CardTitle>
              <CardDescription className="text-xs">
                You will be notified immediately when a cancelled slot frees up.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 text-[11px]">
            Auto-allocation Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {entries.map((entry) => {
            const rawEmail = entry.doctor?.user?.email || "doctor";
            const doctorName = rawEmail
              .split("@")[0]
              .replace(/\./g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            const specialty = entry.doctor?.specialty || "Specialist";
            const fromDate = new Date(entry.from).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const toDate = new Date(entry.to).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const isOffered = entry.status === "OFFERED";
            const isCurrentLeaving = isPending && leavingId === entry.id;

            return (
              <div
                key={entry.id}
                className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                  isOffered
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-border/80 bg-background/80"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <IconStethoscope className="h-3.5 w-3.5 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground">
                          Dr. {doctorName}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{specialty}</p>
                    </div>

                    <Badge
                      variant={isOffered ? "default" : "secondary"}
                      className={`text-[10px] uppercase font-bold tracking-wider ${
                        isOffered ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""
                      }`}
                    >
                      {entry.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <IconCalendar className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Window: {fromDate} – {toDate}
                    </span>
                  </div>

                  {isOffered && (
                    <div className="rounded-lg bg-emerald-500/15 p-2 text-xs text-emerald-800 dark:text-emerald-200">
                      🎉 A slot just opened up! Check your notifications or book now.
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-end gap-2 border-t border-border/50 pt-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isCurrentLeaving}
                    onClick={() => handleLeave(entry.id)}
                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                  >
                    {isCurrentLeaving ? (
                      <IconLoader className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <IconX className="h-3.5 w-3.5 mr-1" />
                    )}
                    Leave Waitlist
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
