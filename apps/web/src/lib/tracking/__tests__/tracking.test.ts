import { describe, expect, test } from "bun:test";
import type { TrackingDetails } from "../types";

describe("Tracking Domain Tests", () => {
  test("TrackingDetails structure correctly models queue position and wait time", () => {
    const details: TrackingDetails = {
      status: "CHECKED_IN",
      queuePosition: 3,
      patientsAhead: 2,
      estimatedWaitMinutes: 30,
      doctor: {
        specialty: "Cardiology",
        consultationFee: 1200,
        email: "dr.smith@clinicq.health",
      },
      slot: {
        startsAt: "2026-10-17T10:00:00.000Z",
        endsAt: "2026-10-17T10:15:00.000Z",
      },
      patientInitials: "J.D.",
      checkedInAt: "2026-10-17T09:45:00.000Z",
      consultStartedAt: null,
      completedAt: null,
    };

    expect(details.status).toBe("CHECKED_IN");
    expect(details.queuePosition).toBe(3);
    expect(details.patientsAhead).toBe(2);
    expect(details.estimatedWaitMinutes).toBe(30);
    expect(details.patientInitials).toBe("J.D.");
  });

  test("TrackingDetails models un-checked-in booked appointment", () => {
    const details: TrackingDetails = {
      status: "BOOKED",
      queuePosition: null,
      patientsAhead: 0,
      estimatedWaitMinutes: 0,
      doctor: {
        specialty: "General Medicine",
        consultationFee: "800",
        email: "dr.rahim@clinicq.health",
      },
      slot: {
        startsAt: "2026-10-17T14:00:00.000Z",
        endsAt: "2026-10-17T14:15:00.000Z",
      },
      patientInitials: "A.H.",
      checkedInAt: null,
      consultStartedAt: null,
      completedAt: null,
    };

    expect(details.status).toBe("BOOKED");
    expect(details.queuePosition).toBeNull();
    expect(details.checkedInAt).toBeNull();
  });
});
