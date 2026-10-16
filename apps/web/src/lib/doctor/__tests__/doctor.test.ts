import { describe, expect, test } from "bun:test";
import {
  calculateConsultationDurationMinutes,
  formatElapsedMinutes,
  sortAppointmentsByUrgency,
} from "../utils";
import type { AppointmentItem } from "@/lib/appointments/types";

describe("Doctor Consultation Duration & Time Formatting", () => {
  test("calculates positive consultation duration correctly", () => {
    const startedAt = "2026-10-16T10:00:00.000Z";
    const completedAt = "2026-10-16T10:14:30.000Z";
    const duration = calculateConsultationDurationMinutes(startedAt, completedAt);
    expect(duration).toBe(15);
  });

  test("handles missing timestamps gracefully", () => {
    expect(calculateConsultationDurationMinutes(null, null)).toBe(0);
    expect(calculateConsultationDurationMinutes("2026-10-16T10:00:00.000Z", null)).toBe(0);
  });

  test("formatElapsedMinutes returns valid duration string", () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(formatElapsedMinutes(tenMinutesAgo)).toBe("10m");
  });

  test("formatElapsedMinutes handles missing startedAt", () => {
    expect(formatElapsedMinutes(null)).toBe("0m");
  });
});

describe("Doctor Clinical Urgency Sorting", () => {
  test("sorts EMERGENCY ahead of URGENT and ROUTINE", () => {
    const items: AppointmentItem[] = [
      {
        id: "1",
        urgency: "ROUTINE",
        slot: { startsAt: "2026-10-16T10:00:00.000Z" },
      } as AppointmentItem,
      {
        id: "2",
        urgency: "EMERGENCY",
        slot: { startsAt: "2026-10-16T11:00:00.000Z" },
      } as AppointmentItem,
      {
        id: "3",
        urgency: "URGENT",
        slot: { startsAt: "2026-10-16T09:00:00.000Z" },
      } as AppointmentItem,
    ];

    const sorted = sortAppointmentsByUrgency(items);
    expect(sorted[0]?.id).toBe("2"); // EMERGENCY first
    expect(sorted[1]?.id).toBe("3"); // URGENT second
    expect(sorted[2]?.id).toBe("1"); // ROUTINE third
  });
});
