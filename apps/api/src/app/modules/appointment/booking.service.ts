import crypto from "node:crypto";
import prisma from "../../../lib/prisma";
import { AppError } from "../../errors/AppError";
import {
  AuditActorType,
  BookingChannel,
  Role,
  SlotStatus,
  UrgencyLevel,
} from "../../../generated/prisma/client";

export interface BookingActor {
  id: string;
  role: Role | string;
  clinicId: string;
  isAssistant?: boolean;
}

export interface BookAppointmentOptions {
  slotId: string;
  patientId: string;
  reason: string;
  assistantSummary?: string | undefined;
  urgency?: UrgencyLevel | undefined;
  bookedVia?: BookingChannel | undefined;
  idempotencyKey: string;
}

export class BookingService {
  /**
   * The single, shared booking pipeline across Manual API, Reception, and Assistant.
   * Enforces:
   * 1. Idempotency (replay returns original appointment)
   * 2. Transactional conditional update (Slot AVAILABLE -> BOOKED)
   * 3. Concurrency safety (zero rows updated -> 409 Conflict)
   * 4. Automatic AuditLog entry inside the same transaction
   */
  static async bookAppointment(options: BookAppointmentOptions, actor: BookingActor) {
    const {
      slotId,
      patientId,
      reason,
      assistantSummary,
      urgency = UrgencyLevel.ROUTINE,
      bookedVia = BookingChannel.MANUAL,
      idempotencyKey,
    } = options;

    // 1. Idempotency Check: if key already booked, return existing appointment
    const existing = await prisma.appointment.findUnique({
      where: { idempotencyKey },
      include: {
        slot: {
          include: {
            doctor: {
              include: {
                user: {
                  select: { id: true, email: true, preferredLanguage: true },
                },
              },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (existing) {
      return existing;
    }

    // 2. Validate patient exists
    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) {
      throw new AppError(404, "Patient profile not found");
    }

    if (patient.user.clinicId !== actor.clinicId) {
      throw new AppError(403, "Patient belongs to another clinic");
    }

    // Generate unguessable tracking token for public tracking link
    const trackingToken = crypto.randomUUID();

    // 3. Transactional conditional booking
    const appointment = await prisma.$transaction(async (tx) => {
      // Find the slot to verify clinic ownership and existence
      const targetSlot = await tx.slot.findUnique({
        where: { id: slotId },
        include: { doctor: { include: { user: true } } },
      });

      if (!targetSlot) {
        throw new AppError(404, "Slot not found");
      }

      if (targetSlot.doctor.user.clinicId !== actor.clinicId) {
        throw new AppError(403, "Doctor belongs to another clinic");
      }

      // Conditional atomic update — if slot was already taken concurrently, count is 0
      const updateResult = await tx.slot.updateMany({
        where: {
          id: slotId,
          status: SlotStatus.AVAILABLE,
        },
        data: {
          status: SlotStatus.BOOKED,
        },
      });

      if (updateResult.count === 0) {
        throw new AppError(409, "Slot is no longer available; please choose another slot");
      }

      // Create Appointment record
      const newAppointment = await tx.appointment.create({
        data: {
          slotId,
          patientId,
          reason,
          assistantSummary: assistantSummary ?? null,
          urgency,
          bookedVia,
          idempotencyKey,
          trackingToken,
        },
        include: {
          slot: {
            include: {
              doctor: {
                include: {
                  user: {
                    select: { id: true, email: true, preferredLanguage: true },
                  },
                },
              },
            },
          },
          patient: {
            include: {
              user: {
                select: { id: true, email: true },
              },
            },
          },
        },
      });

      // Write AuditLog in the same transaction
      await tx.auditLog.create({
        data: {
          clinicId: actor.clinicId,
          actorType: actor.isAssistant ? AuditActorType.ASSISTANT : AuditActorType.USER,
          actorId: actor.id,
          action: "APPOINTMENT_BOOKED",
          entity: "Appointment",
          entityId: newAppointment.id,
          metadata: {
            slotId,
            doctorId: targetSlot.doctorId,
            patientId,
            bookedVia,
            urgency,
            idempotencyKey,
          },
        },
      });

      return newAppointment;
    });

    return appointment;
  }
}
