import { describe, expect, test } from "bun:test";
import {
  updateQueueStatusSchema,
  walkInBookingSchema,
} from "../validation";

describe("Queue Validation Schemas", () => {
  test("updateQueueStatusSchema accepts valid status transitions", () => {
    const valid = updateQueueStatusSchema.safeParse({
      appointmentId: "apt_12345",
      status: "CHECKED_IN",
      reason: "Patient arrived on-time",
    });
    expect(valid.success).toBe(true);
  });

  test("updateQueueStatusSchema rejects invalid statuses", () => {
    const invalid = updateQueueStatusSchema.safeParse({
      appointmentId: "apt_12345",
      status: "INVALID_STATUS",
    });
    expect(invalid.success).toBe(false);
  });

  test("walkInBookingSchema accepts valid walk-in registration details", () => {
    const valid = walkInBookingSchema.safeParse({
      patientEmail: "walkin@patient.com",
      patientPhone: "+8801711223344",
      preferredLanguage: "en",
      doctorId: "doc_123",
      slotId: "slot_456",
      reason: "Severe fever and body aches",
      autoCheckIn: true,
    });
    expect(valid.success).toBe(true);
  });

  test("walkInBookingSchema rejects invalid email format", () => {
    const invalid = walkInBookingSchema.safeParse({
      patientEmail: "not-an-email",
      doctorId: "doc_123",
      slotId: "slot_456",
      reason: "Headache",
    });
    expect(invalid.success).toBe(false);
  });

  test("walkInBookingSchema rejects reason shorter than 3 characters", () => {
    const invalid = walkInBookingSchema.safeParse({
      patientEmail: "walkin@patient.com",
      doctorId: "doc_123",
      slotId: "slot_456",
      reason: "hi",
    });
    expect(invalid.success).toBe(false);
  });
});
