import prisma from "../../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { AppointmentStatus } from "../../../generated/prisma/client";
import { calculateAdaptiveConsultMinutes } from "./queue.utils";

export class QueueService {
  /**
   * Retrieves the adaptive consultation duration based on real completed consultations.
   */
  static async getDoctorAdaptiveDuration(doctorId: string, baselineMinutes = 15): Promise<number> {
    const recent = await prisma.appointment.findMany({
      where: {
        slot: { doctorId },
        status: AppointmentStatus.COMPLETED,
        consultStartedAt: { not: null },
        completedAt: { not: null },
      },
      orderBy: { completedAt: "desc" },
      take: 10,
      select: {
        consultStartedAt: true,
        completedAt: true,
      },
    });

    const durations = recent
      .map((a) => {
        if (!a.consultStartedAt || !a.completedAt) return 0;
        const diffMs = a.completedAt.getTime() - a.consultStartedAt.getTime();
        return Math.round(diffMs / (60 * 1000));
      })
      .reverse(); // Chronological order: oldest to newest

    return calculateAdaptiveConsultMinutes(durations, baselineMinutes);
  }

  /**
   * Retrieves today's live queue for a specific doctor.
   */
  static async getDoctorQueue(doctorId: string, clinicId?: string) {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: { id: true, email: true, clinicId: true },
        },
      },
    });

    if (!doctor) {
      throw new AppError(404, "Doctor not found");
    }

    if (clinicId && doctor.user.clinicId !== clinicId) {
      throw new AppError(403, "Doctor belongs to another clinic");
    }

    const adaptiveMinutes = await this.getDoctorAdaptiveDuration(
      doctorId,
      doctor.avgConsultMinutes,
    );

    // Today boundaries
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        slot: { doctorId },
        OR: [
          // Any patient currently in consultation or waiting in clinic right now
          {
            status: {
              in: [
                AppointmentStatus.IN_CONSULTATION,
                AppointmentStatus.CHECKED_IN,
              ],
            },
          },
          // Or any booked/completed appointment scheduled for today
          {
            status: {
              in: [AppointmentStatus.BOOKED, AppointmentStatus.COMPLETED],
            },
            slot: {
              doctorId,
              startsAt: { gte: startOfDay, lte: endOfDay },
            },
          },
        ],
      },
      include: {
        slot: { select: { startsAt: true, endsAt: true } },
        patient: {
          include: {
            user: { select: { email: true, preferredLanguage: true } },
          },
        },
      },
      orderBy: {
        checkedInAt: "asc",
      },
    });

    const inConsultation = appointments.find(
      (a) => a.status === AppointmentStatus.IN_CONSULTATION,
    );

    const checkedInRaw = appointments
      .filter((a) => a.status === AppointmentStatus.CHECKED_IN)
      .sort((a, b) => {
        const timeA = a.checkedInAt ? a.checkedInAt.getTime() : 0;
        const timeB = b.checkedInAt ? b.checkedInAt.getTime() : 0;
        return timeA - timeB;
      });

    const checkedInQueue = checkedInRaw.map((a, index) => {
      const emailPrefix = a.patient.user.email.split("@")[0] || "";
      const initials =
        emailPrefix
          .split(/[._-]/)
          .filter(Boolean)
          .map((part) => part[0]?.toUpperCase())
          .join(".") + ".";

      return {
        id: a.id,
        status: a.status,
        queuePosition: index + 1,
        patientsAhead: index,
        estimatedWaitMinutes: index * adaptiveMinutes,
        patientInitials: initials,
        reason: a.reason,
        urgency: a.urgency,
        checkedInAt: a.checkedInAt,
        slotStartsAt: a.slot.startsAt,
      };
    });

    const upcomingBooked = appointments
      .filter((a) => a.status === AppointmentStatus.BOOKED)
      .sort((a, b) => a.slot.startsAt.getTime() - b.slot.startsAt.getTime())
      .map((a) => {
        const emailPrefix = a.patient.user.email.split("@")[0] || "";
        const initials =
          emailPrefix
            .split(/[._-]/)
            .filter(Boolean)
            .map((part) => part[0]?.toUpperCase())
            .join(".") + ".";

        return {
          id: a.id,
          status: a.status,
          slotStartsAt: a.slot.startsAt,
          patientInitials: initials,
          reason: a.reason,
          urgency: a.urgency,
        };
      });

    return {
      doctor: {
        id: doctor.id,
        specialty: doctor.specialty,
        consultationFee: doctor.consultationFee,
        baselineMinutes: doctor.avgConsultMinutes,
        email: doctor.user.email,
      },
      adaptiveConsultMinutes: adaptiveMinutes,
      currentConsultation: inConsultation
        ? {
            id: inConsultation.id,
            status: inConsultation.status,
            consultStartedAt: inConsultation.consultStartedAt,
            slotStartsAt: inConsultation.slot.startsAt,
          }
        : null,
      totalWaiting: checkedInQueue.length,
      checkedInQueue,
      upcomingBooked,
    };
  }

  /**
   * Retrieves an overview of queues for all doctors in a clinic (reception/admin dashboard).
   */
  static async getClinicQueueOverview(clinicId: string) {
    const doctors = await prisma.doctorProfile.findMany({
      where: { user: { clinicId } },
      include: {
        user: { select: { email: true } },
      },
      orderBy: { specialty: "asc" },
    });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const summaries = await Promise.all(
      doctors.map(async (doc) => {
        const [inConsultation, checkedIn, booked, adaptiveMinutes] = await Promise.all([
          prisma.appointment.count({
            where: {
              slot: { doctorId: doc.id, startsAt: { gte: startOfDay, lte: endOfDay } },
              status: AppointmentStatus.IN_CONSULTATION,
            },
          }),
          prisma.appointment.count({
            where: {
              slot: { doctorId: doc.id, startsAt: { gte: startOfDay, lte: endOfDay } },
              status: AppointmentStatus.CHECKED_IN,
            },
          }),
          prisma.appointment.count({
            where: {
              slot: { doctorId: doc.id, startsAt: { gte: startOfDay, lte: endOfDay } },
              status: AppointmentStatus.BOOKED,
            },
          }),
          this.getDoctorAdaptiveDuration(doc.id, doc.avgConsultMinutes),
        ]);

        return {
          doctorId: doc.id,
          doctorEmail: doc.user.email,
          specialty: doc.specialty,
          adaptiveConsultMinutes: adaptiveMinutes,
          inConsultationCount: inConsultation,
          checkedInCount: checkedIn,
          bookedCount: booked,
          estimatedTotalWaitMinutes: checkedIn * adaptiveMinutes,
        };
      }),
    );

    return summaries;
  }
}
