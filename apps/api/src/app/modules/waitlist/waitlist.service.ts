import prisma from "../../../lib/prisma";
import { AppError } from "../../errors/AppError";
import {
  AuditActorType,
  Role,
  WaitlistStatus,
} from "../../../generated/prisma/client";
import type { JoinWaitlistInput, WaitlistQuery } from "./waitlist.validation";

export class WaitlistService {
  static async join(
    data: JoinWaitlistInput,
    actor: { id: string; role: Role | string; clinicId: string },
  ) {
    let patientId = data.patientId;

    if (actor.role === Role.PATIENT) {
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: actor.id },
      });
      if (!patientProfile) {
        throw new AppError(404, "Patient profile not found");
      }
      patientId = patientProfile.id;
    } else {
      if (!patientId) {
        throw new AppError(400, "patientId is required when staff joins on behalf of patient");
      }
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: data.doctorId },
      include: { user: true },
    });

    if (!doctor) {
      throw new AppError(404, "Doctor not found");
    }

    if (doctor.user.clinicId !== actor.clinicId) {
      throw new AppError(403, "Doctor belongs to another clinic");
    }

    const fromDate = new Date(data.from);
    const toDate = new Date(data.to);

    if (fromDate >= toDate) {
      throw new AppError(400, "'from' date must be before 'to' date");
    }

    const entry = await prisma.waitlistEntry.create({
      data: {
        patientId,
        doctorId: data.doctorId,
        from: fromDate,
        to: toDate,
        status: WaitlistStatus.WAITING,
      },
      include: {
        patient: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    return entry;
  }

  static async getWaitlist(
    actor: { id: string; role: Role | string; clinicId: string },
    query: WaitlistQuery = { page: 1, limit: 20 },
  ) {
    const { doctorId, patientId, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      patient: {
        user: { clinicId: actor.clinicId },
      },
    };

    if (actor.role === Role.PATIENT) {
      where.patient.userId = actor.id;
    }

    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const [total, entries] = await Promise.all([
      prisma.waitlistEntry.count({ where }),
      prisma.waitlistEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
        include: {
          patient: {
            include: {
              user: { select: { id: true, email: true } },
            },
          },
        },
      }),
    ]);

    return {
      entries,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async leave(
    id: string,
    actor: { id: string; role: Role | string; clinicId: string },
  ) {
    const entry = await prisma.waitlistEntry.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
      },
    });

    if (!entry) {
      throw new AppError(404, "Waitlist entry not found");
    }

    if (entry.patient.user.clinicId !== actor.clinicId) {
      throw new AppError(403, "Permission denied across clinics");
    }

    if (actor.role === Role.PATIENT && entry.patient.userId !== actor.id) {
      throw new AppError(403, "You can only cancel your own waitlist requests");
    }

    await prisma.waitlistEntry.delete({
      where: { id },
    });
  }

  /**
   * Promotes the next eligible waiting patient when an appointment slot becomes available.
   */
  static async offerNextInLine(
    doctorId: string,
    freedSlotStartsAt: Date,
    clinicId?: string,
  ) {
    const candidate = await prisma.waitlistEntry.findFirst({
      where: {
        doctorId,
        status: WaitlistStatus.WAITING,
        from: { lte: freedSlotStartsAt },
        to: { gte: freedSlotStartsAt },
      },
      orderBy: { createdAt: "asc" },
      include: {
        patient: {
          include: {
            user: { select: { id: true, email: true, clinicId: true } },
          },
        },
      },
    });

    if (!candidate) {
      return null;
    }

    const updated = await prisma.waitlistEntry.update({
      where: { id: candidate.id },
      data: { status: WaitlistStatus.OFFERED },
      include: {
        patient: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    // Write AuditLog
    await prisma.auditLog.create({
      data: {
        clinicId: candidate.patient.user.clinicId || clinicId || "unknown",
        actorType: AuditActorType.USER,
        actorId: "SYSTEM_WAITLIST",
        action: "WAITLIST_SLOT_OFFERED",
        entity: "WaitlistEntry",
        entityId: candidate.id,
        metadata: {
          doctorId,
          freedSlotStartsAt: freedSlotStartsAt.toISOString(),
          patientId: candidate.patientId,
        },
      },
    });

    return updated;
  }
}
