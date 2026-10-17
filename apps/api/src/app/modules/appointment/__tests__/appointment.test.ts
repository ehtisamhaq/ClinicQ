import { describe, it, expect } from "bun:test";
import {
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
  appointmentQuerySchema,
} from "../appointment.validation";
import {
  AppointmentStatus,
  BookingChannel,
  Role,
  UrgencyLevel,
} from "../../../../generated/prisma/client";
import { AppointmentService } from "../appointment.service";

describe("Appointment Module Tests", () => {
  describe("Appointment Validation Schemas", () => {
    it("should accept valid booking input", () => {
      const valid = {
        slotId: "slot-123",
        reason: "Persistent migraine and nausea",
        urgency: UrgencyLevel.SOON,
        bookedVia: BookingChannel.MANUAL,
      };
      const result = bookAppointmentSchema.body.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.urgency).toBe(UrgencyLevel.SOON);
        expect(result.data.bookedVia).toBe(BookingChannel.MANUAL);
      }
    });

    it("should reject booking reason shorter than 3 characters", () => {
      const invalid = {
        slotId: "slot-123",
        reason: "hi",
      };
      const result = bookAppointmentSchema.body.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should validate reschedule schema requiring newSlotId", () => {
      expect(
        rescheduleAppointmentSchema.body.safeParse({ newSlotId: "slot-456" }).success,
      ).toBe(true);
      expect(rescheduleAppointmentSchema.body.safeParse({}).success).toBe(false);
    });

    it("should validate appointment query pagination defaults", () => {
      const result = appointmentQuerySchema.query.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });
  });

  describe("Lifecycle State Machine Transition Validation", () => {
    const mockAppointment = {
      slot: {
        doctor: {
          userId: "doctor-user-id",
        },
      },
      patient: {
        userId: "patient-user-id",
      },
    };

    const receptionistActor = {
      id: "reception-user-id",
      role: Role.RECEPTIONIST,
      clinicId: "clinic-1",
    };

    const assignedDoctorActor = {
      id: "doctor-user-id",
      role: Role.DOCTOR,
      clinicId: "clinic-1",
    };

    const otherDoctorActor = {
      id: "other-doctor-id",
      role: Role.DOCTOR,
      clinicId: "clinic-1",
    };

    const patientOwnerActor = {
      id: "patient-user-id",
      role: Role.PATIENT,
      clinicId: "clinic-1",
    };

    const otherPatientActor = {
      id: "stranger-id",
      role: Role.PATIENT,
      clinicId: "clinic-1",
    };

    // Helper calling private validateTransition via casting
    const validate = (
      current: AppointmentStatus,
      next: AppointmentStatus,
      actor: any,
    ): boolean => {
      return (AppointmentService as any).validateTransition(
        current,
        next,
        actor,
        mockAppointment,
      );
    };

    it("should allow RECEPTIONIST to check in a BOOKED appointment", () => {
      expect(
        validate(AppointmentStatus.BOOKED, AppointmentStatus.CHECKED_IN, receptionistActor),
      ).toBe(true);
    });

    it("should allow assigned DOCTOR to start consultation on CHECKED_IN patient", () => {
      expect(
        validate(
          AppointmentStatus.CHECKED_IN,
          AppointmentStatus.IN_CONSULTATION,
          assignedDoctorActor,
        ),
      ).toBe(true);
    });

    it("should allow assigned DOCTOR to admit a BOOKED patient directly into consultation", () => {
      expect(
        validate(
          AppointmentStatus.BOOKED,
          AppointmentStatus.IN_CONSULTATION,
          assignedDoctorActor,
        ),
      ).toBe(true);
    });

    it("should forbid other DOCTOR from starting consultation on patient assigned to another doctor", () => {
      expect(
        validate(
          AppointmentStatus.CHECKED_IN,
          AppointmentStatus.IN_CONSULTATION,
          otherDoctorActor,
        ),
      ).toBe(false);
    });

    it("should allow assigned DOCTOR to complete consultation from IN_CONSULTATION", () => {
      expect(
        validate(
          AppointmentStatus.IN_CONSULTATION,
          AppointmentStatus.COMPLETED,
          assignedDoctorActor,
        ),
      ).toBe(true);
    });

    it("should allow patient owner to CANCEL a BOOKED appointment", () => {
      expect(
        validate(AppointmentStatus.BOOKED, AppointmentStatus.CANCELLED, patientOwnerActor),
      ).toBe(true);
    });

    it("should forbid stranger patient from cancelling someone else's appointment", () => {
      expect(
        validate(AppointmentStatus.BOOKED, AppointmentStatus.CANCELLED, otherPatientActor),
      ).toBe(false);
    });

    it("should allow RECEPTIONIST to mark NO_SHOW on a BOOKED appointment", () => {
      expect(
        validate(AppointmentStatus.BOOKED, AppointmentStatus.NO_SHOW, receptionistActor),
      ).toBe(true);
    });

    it("should reject illegal state transitions (e.g., BOOKED directly to COMPLETED)", () => {
      expect(
        validate(AppointmentStatus.BOOKED, AppointmentStatus.COMPLETED, assignedDoctorActor),
      ).toBe(false);
    });

    it("should reject transition out of terminal state (e.g., COMPLETED to CHECKED_IN)", () => {
      expect(
        validate(
          AppointmentStatus.COMPLETED,
          AppointmentStatus.CHECKED_IN,
          receptionistActor,
        ),
      ).toBe(false);
    });

    it("should reject transition out of CANCELLED", () => {
      expect(
        validate(
          AppointmentStatus.CANCELLED,
          AppointmentStatus.BOOKED,
          receptionistActor,
        ),
      ).toBe(false);
    });
  });
});
