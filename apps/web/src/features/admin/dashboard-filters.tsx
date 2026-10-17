"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconCalendar } from "@tabler/icons-react";

export function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";

  const applyPreset = (days: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (days === null) {
      params.delete("from");
      params.delete("to");
    } else {
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      const from = new Date();
      from.setDate(to.getDate() - days);
      from.setHours(0, 0, 0, 0);
      params.set("from", from.toISOString());
      params.set("to", to.toISOString());
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  const isPresetActive = (days: number | null) => {
    if (days === null) return !currentFrom && !currentTo;
    if (!currentFrom || !currentTo) return false;
    const diffDays = Math.round(
      (new Date(currentTo).getTime() - new Date(currentFrom).getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.abs(diffDays - days) <= 1;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-card/60 p-1 shadow-2xs">
        <IconCalendar className="ml-2 h-4 w-4 text-muted-foreground" />
        <Button
          variant={isPresetActive(null) ? "secondary" : "ghost"}
          size="sm"
          className="h-8 text-xs font-medium rounded-lg"
          onClick={() => applyPreset(null)}
        >
          All Time
        </Button>
        <Button
          variant={isPresetActive(1) ? "secondary" : "ghost"}
          size="sm"
          className="h-8 text-xs font-medium rounded-lg"
          onClick={() => applyPreset(1)}
        >
          Today
        </Button>
        <Button
          variant={isPresetActive(7) ? "secondary" : "ghost"}
          size="sm"
          className="h-8 text-xs font-medium rounded-lg"
          onClick={() => applyPreset(7)}
        >
          7 Days
        </Button>
        <Button
          variant={isPresetActive(30) ? "secondary" : "ghost"}
          size="sm"
          className="h-8 text-xs font-medium rounded-lg"
          onClick={() => applyPreset(30)}
        >
          30 Days
        </Button>
      </div>
    </div>
  );
}
