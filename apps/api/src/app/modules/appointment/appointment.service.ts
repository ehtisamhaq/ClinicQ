import prisma from "../../../lib/prisma";
import { AppError } from "../../errors/AppError";
import {
  AppointmentStatus,
  AuditActorType,
  Role,
  SlotStatus,
} from "../../../generated/prisma/client";
import { BookingService, type BookingActor } from "./booking.service";
import { emitQueueUpdated, emitSlotBooked } from "../../../socket";
import { WaitlistService } from "../waitlist/waitlist.service";
import type {
  AppointmentQuery,
  BookAppointmentInput,
} from "./appointment.validation";

export class AppointmentService {
  static async book(
    data: BookAppointmentInput,
    actor: BookingActor,
    idempotencyKeyHeader?: string,
  ) {
    let patientId = data.patientId;

    if (actor.role === Role.PATIENT) {
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: actor.id },
      });
      if (!patientProfile) {
        throw new AppError(404, "Patient profile not found for current user");
      }
      patientId = patientProfile.id;
    } else {
      if (!patientId) {
        throw new AppError(400, "patientId is required when booking as staff");
      }
    }

    const idempotencyKey =
      idempotencyKeyHeader ||
      `idem-${actor.id}-${data.slotId}-${Date.now()}`;

    return BookingService.bookAppointment(
      {
        slotId: data.slotId,
        patientId,
        reason: data.reason,
        assistantSummary: data.assistantSummary,
        urgency: data.urgency,
        bookedVia: data.bookedVia,
        idempotencyKey,
      },
      actor,
    );
  }

  static async getAppointments(
    actor: BookingActor,
    query: AppointmentQuery = { page: 1, limit: 20 },
  ) {
    const { patientId, doctorId, status, from, to, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      slot: {
        doctor: {
          user: {
            clinicId: actor.clinicId,
          },
        },
      },
    };

    // Role-based visibility
    if (actor.role === Role.PATIENT) {
      where.patient = { userId: actor.id };
    } else if (actor.role === Role.DOCTOR) {
      where.slot.doctor.userId = actor.id;
    }

    // Filters
    if (patientId) where.patientId = patientId;
    if (doctorId) where.slot.doctorId = doctorId;
    if (status) where.status = status;

    if (from || to) {
      where.slot.startsAt = {};
      if (from) where.slot.startsAt.gte = new Date(from);
      if (to) where.slot.startsAt.lte = new Date(to);
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          slot: {
            startsAt: "asc",
          },
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
                select: { id: true, email: true, preferredLanguage: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      appointments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getAppointmentById(id: string, actor: BookingActor) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        slot: {
          include: {
            doctor: {
              include: {
                user: {
                  select: { id: true, email: true, preferredLanguage: true, clinicId: true },
                },
              },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: { id: true, email: true, preferredLanguage: true },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new AppError(404, "Appointment not found");
    }

    if (appointment.slot.doctor.user.clinicId !== actor.clinicId) {
      throw new AppError(403, "Appointment belongs to another clinic");
    }

    if (actor.role === Role.PATIENT && appointment.patient.userId !== actor.id) {
      throw new AppError(403, "You can only view your own appointments");
    }

    if (actor.role === Role.DOCTOR && appointment.slot.doctor.userId !== actor.id) {
      throw new AppError(403, "You can only view appointments assigned to you");
    }

    return appointment;
  }

  static async reschedule(id: string, newSlotId: string, actor: BookingActor) {
    const appointment = await this.getAppointmentById(id, actor);

    if (appointment.status !== AppointmentStatus.BOOKED) {
      throw new AppError(
        400,
        `Cannot reschedule appointment with status ${appointment.status}. Only BOOKED appointments can be rescheduled.`,
      );
    }

    if (appointment.slotId === newSlotId) {
      throw new AppError(400, "New slot must be different from current slot");
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Free current slot
      await tx.slot.update({
        where: { id: appointment.slotId },
        data: { status: SlotStatus.AVAILABLE },
      });

      // 2. Reserve new slot atomically
      const updateResult = await tx.slot.updateMany({
        where: { id: newSlotId, status: SlotStatus.AVAILABLE },
        data: { status: SlotStatus.BOOKED },
      });

      if (updateResult.count === 0) {
        throw new AppError(409, "The selected new slot is no longer available");
      }

      // 3. Update appointment
      const rescheduled = await tx.appointment.update({
        where: { id },
        data: { slotId: newSlotId },
        include: {
          slot: {
            include: {
              doctor: {
                include: {
                  user: {
                    select: { id: true, email: true },
                  },
                },
              },
            },
          },
          patient: true,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          clinicId: actor.clinicId,
          actorType: actor.isAssistant ? AuditActorType.ASSISTANT : AuditActorType.USER,
          actorId: actor.id,
          action: "APPOINTMENT_RESCHEDULED",
          entity: "Appointment",
          entityId: id,
          metadata: {
            oldSlotId: appointment.slotId,
            newSlotId,
          },
        },
      });

      return rescheduled;
    });

    emitSlotBooked(appointment.slot.doctorId, actor.clinicId, newSlotId);
    emitQueueUpdated(appointment.slot.doctorId, actor.clinicId);

    // Promote next patient on waitlist for the freed old slot
    WaitlistService.offerNextInLine(
      appointment.slot.doctorId,
      appointment.slot.startsAt,
      actor.clinicId,
    ).catch((err) => console.warn("Waitlist offer error on reschedule:", err));

    return updated;
  }

  static async cancel(id: string, actor: BookingActor, reason?: string) {
    const appointment = await this.getAppointmentById(id, actor);

    if (
      appointment.status !== AppointmentStatus.BOOKED &&
      appointment.status !== AppointmentStatus.CHECKED_IN
    ) {
      throw new AppError(
        400,
        `Cannot cancel an appointment that is already ${appointment.status}`,
      );
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      // 1. Free the slot
      await tx.slot.update({
        where: { id: appointment.slotId },
        data: { status: SlotStatus.AVAILABLE },
      });

      // 2. Update status
      const updated = await tx.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CANCELLED },
        include: { slot: true, patient: true },
      });

      // 3. Write Audit Log
      await tx.auditLog.create({
        data: {
          clinicId: actor.clinicId,
          actorType: actor.isAssistant ? AuditActorType.ASSISTANT : AuditActorType.USER,
          actorId: actor.id,
          action: "APPOINTMENT_CANCELLED",
          entity: "Appointment",
          entityId: id,
          metadata: {
            slotId: appointment.slotId,
            reason: reason || "User requested cancellation",
          },
        },
      });

      return updated;
    });

    emitQueueUpdated(appointment.slot.doctorId, actor.clinicId);

    // Promote next patient on waitlist for the freed slot
    WaitlistService.offerNextInLine(
      appointment.slot.doctorId,
      appointment.slot.startsAt,
      actor.clinicId,
    ).catch((err) => console.warn("Waitlist offer error on cancel:", err));

    return cancelled;
  }

  static async updateStatus(
    id: string,
    newStatus: AppointmentStatus,
    actor: BookingActor,
    reason?: string,
  ) {
    const appointment = await this.getAppointmentById(id, actor);
    const current = appointment.status;

    // Validate lifecycle transitions and role restrictions
    // Flow: BOOKED -> CHECKED_IN -> IN_CONSULTATION -> COMPLETED;
    //       BOOKED/CHECKED_IN -> CANCELLED;
    //       BOOKED -> NO_SHOW.
    const allowed = this.validateTransition(current, newStatus, actor, appointment);
    if (!allowed) {
      throw new AppError(
        400,
        `Transition from ${current} to ${newStatus} is not permitted for your role (${actor.role})`,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = { status: newStatus };

      if (newStatus === AppointmentStatus.CHECKED_IN) {
        updateData.checkedInAt = new Date();
      } else if (newStatus === AppointmentStatus.IN_CONSULTATION) {
        updateData.consultStartedAt = new Date();
      } else if (newStatus === AppointmentStatus.COMPLETED) {
        updateData.completedAt = new Date();
      } else if (newStatus === AppointmentStatus.CANCELLED) {
        // Free slot on cancellation
        await tx.slot.update({
          where: { id: appointment.slotId },
          data: { status: SlotStatus.AVAILABLE },
        });
      }

      const result = await tx.appointment.update({
        where: { id },
        data: updateData,
        include: {
          slot: {
            include: {
              doctor: {
                include: {
                  user: { select: { id: true, email: true } },
                },
              },
            },
          },
          patient: true,
        },
      });

      await tx.auditLog.create({
        data: {
          clinicId: actor.clinicId,
          actorType: actor.isAssistant ? AuditActorType.ASSISTANT : AuditActorType.USER,
          actorId: actor.id,
          action: `APPOINTMENT_STATUS_${newStatus}`,
          entity: "Appointment",
          entityId: id,
          metadata: {
            previousStatus: current,
            newStatus,
            reason: reason ?? null,
          },
        },
      });

      return result;
    });

    emitQueueUpdated(appointment.slot.doctorId, actor.clinicId);

    return updated;
  }

  private static validateTransition(
    current: AppointmentStatus,
    next: AppointmentStatus,
    actor: BookingActor,
    appointment: any,
  ): boolean {
    const isStaff = actor.role === Role.ADMIN || actor.role === Role.RECEPTIONIST;
    const isAssignedDoctor =
      actor.role === Role.DOCTOR && appointment.slot.doctor.userId === actor.id;
    const isPatientOwner =
      actor.role === Role.PATIENT && appointment.patient.userId === actor.id;

    if (current === AppointmentStatus.BOOKED && next === AppointmentStatus.CHECKED_IN) {
      return isStaff;
    }

    if (current === AppointmentStatus.CHECKED_IN && next === AppointmentStatus.IN_CONSULTATION) {
      return isAssignedDoctor || actor.role === Role.ADMIN;
    }

    if (current === AppointmentStatus.IN_CONSULTATION && next === AppointmentStatus.COMPLETED) {
      return isAssignedDoctor || actor.role === Role.ADMIN;
    }

    if (current === AppointmentStatus.BOOKED && next === AppointmentStatus.NO_SHOW) {
      return isStaff;
    }

    if (
      (current === AppointmentStatus.BOOKED || current === AppointmentStatus.CHECKED_IN) &&
      next === AppointmentStatus.CANCELLED
    ) {
      return isPatientOwner || isStaff;
    }

    return false;
  }
}
