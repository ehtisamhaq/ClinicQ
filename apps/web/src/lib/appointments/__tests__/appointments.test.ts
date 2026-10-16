import { describe, expect, test } from "bun:test";
import {
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
} from "../validation";
import { isAppointmentToday, isUpcomingAppointment } from "../utils";
import type { AppointmentItem } from "../types";

describe("Appointments Validation Schemas", () => {
  test("cancelAppointmentSchema accepts valid input with reason", () => {
    const valid = cancelAppointmentSchema.safeParse({
      appointmentId: "apt_12345",
      reason: "Unexpected travel",
    });
    expect(valid.success).toBe(true);
  });

  test("cancelAppointmentSchema accepts valid input without optional reason", () => {
    const valid = cancelAppointmentSchema.safeParse({
      appointmentId: "apt_12345",
    });
    expect(valid.success).toBe(true);
  });

  test("cancelAppointmentSchema rejects empty appointmentId", () => {
    const invalid = cancelAppointmentSchema.safeParse({
      appointmentId: "",
    });
    expect(invalid.success).toBe(false);
  });

  test("cancelAppointmentSchema rejects reason longer than 300 characters", () => {
    const invalid = cancelAppointmentSchema.safeParse({
      appointmentId: "apt_12345",
      reason: "a".repeat(301),
    });
    expect(invalid.success).toBe(false);
  });

  test("rescheduleAppointmentSchema accepts valid input", () => {
    const valid = rescheduleAppointmentSchema.safeParse({
      appointmentId: "apt_12345",
      newSlotId: "slot_99999",
    });
    expect(valid.success).toBe(true);
  });

  test("rescheduleAppointmentSchema rejects missing newSlotId", () => {
    const invalid = rescheduleAppointmentSchema.safeParse({
      appointmentId: "apt_12345",
      newSlotId: "",
    });
    expect(invalid.success).toBe(false);
  });
});

describe("Appointment Date & Status Helpers", () => {
  test("isAppointmentToday correctly returns true for today", () => {
    const now = new Date().toISOString();
    expect(isAppointmentToday(now)).toBe(true);
  });

  test("isAppointmentToday correctly returns false for next month", () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(isAppointmentToday(future)).toBe(false);
  });

  test("isUpcomingAppointment identifies BOOKED and CHECKED_IN as upcoming", () => {
    const mockBooked = {
      id: "1",
      status: "BOOKED",
    } as AppointmentItem;

    const mockCheckedIn = {
      id: "2",
      status: "CHECKED_IN",
    } as AppointmentItem;

    expect(isUpcomingAppointment(mockBooked)).toBe(true);
    expect(isUpcomingAppointment(mockCheckedIn)).toBe(true);
  });

  test("isUpcomingAppointment identifies COMPLETED, CANCELLED, NO_SHOW as not upcoming", () => {
    const mockCompleted = { id: "1", status: "COMPLETED" } as AppointmentItem;
    const mockCancelled = { id: "2", status: "CANCELLED" } as AppointmentItem;
    const mockNoShow = { id: "3", status: "NO_SHOW" } as AppointmentItem;

    expect(isUpcomingAppointment(mockCompleted)).toBe(false);
    expect(isUpcomingAppointment(mockCancelled)).toBe(false);
    expect(isUpcomingAppointment(mockNoShow)).toBe(false);
  });
});
