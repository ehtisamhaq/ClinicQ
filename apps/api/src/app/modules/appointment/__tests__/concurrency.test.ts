import { describe, expect, it } from "bun:test";
import prisma from "../../../../lib/prisma";
import { BookingService } from "../booking.service";
import {
  BookingChannel,
  SlotStatus,
  UrgencyLevel,
} from "../../../../generated/prisma/client";

describe("Appointment Concurrency Tests", () => {
  it("should prevent double-booking: exactly one succeeds and one fails with 409 Conflict", async () => {
    // 1. Find or create a test slot in AVAILABLE state
    const testSlot = await prisma.slot.findFirst({
      where: { status: SlotStatus.AVAILABLE },
      include: {
        doctor: {
          include: { user: true },
        },
      },
    });

    if (!testSlot) {
      console.warn("No available slot found for concurrency test. Skipping live DB test.");
      return;
    }

    // Find two distinct patients
    const patientProfiles = await prisma.patientProfile.findMany({
      where: { user: { clinicId: testSlot.doctor.user.clinicId } },
      include: { user: true },
      take: 2,
    });

    if (patientProfiles.length < 2) {
      console.warn("Need at least 2 patient profiles for concurrency test. Skipping.");
      return;
    }

    const patient1 = patientProfiles[0]!;
    const patient2 = patientProfiles[1]!;

    // 2. Fire two simultaneous booking transactions targeting the exact same slot
    const [result1, result2] = await Promise.allSettled([
      BookingService.bookAppointment(
        {
          slotId: testSlot.id,
          patientId: patient1.id,
          reason: "Patient 1 routine consultation checkup",
          bookedVia: BookingChannel.MANUAL,
          urgency: UrgencyLevel.ROUTINE,
          idempotencyKey: `conc-test-1-${testSlot.id}`,
        },
        {
          id: patient1.user.id,
          role: "PATIENT",
          clinicId: testSlot.doctor.user.clinicId,
        },
      ),
      BookingService.bookAppointment(
        {
          slotId: testSlot.id,
          patientId: patient2.id,
          reason: "Patient 2 routine consultation checkup",
          bookedVia: BookingChannel.MANUAL,
          urgency: UrgencyLevel.ROUTINE,
          idempotencyKey: `conc-test-2-${testSlot.id}`,
        },
        {
          id: patient2.user.id,
          role: "PATIENT",
          clinicId: testSlot.doctor.user.clinicId,
        },
      ),
    ]);

    // 3. Verify exactly one succeeded and exactly one failed with 409 Conflict
    const succeeded = [result1, result2].filter((r) => r.status === "fulfilled");
    const failed = [result1, result2].filter((r) => r.status === "rejected");

    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(1);

    const failureReason = (failed[0] as PromiseRejectedResult).reason;
    expect(failureReason.statusCode).toBe(409);
    expect(failureReason.message).toContain("Slot is no longer available");

    // 4. Verify in DB that only 1 appointment exists for this slot
    const appointmentsInDb = await prisma.appointment.findMany({
      where: { slotId: testSlot.id },
    });
    expect(appointmentsInDb.length).toBe(1);

    // Verify slot status is BOOKED
    const updatedSlot = await prisma.slot.findUnique({
      where: { id: testSlot.id },
    });
    expect(updatedSlot?.status).toBe(SlotStatus.BOOKED);
  });
});
