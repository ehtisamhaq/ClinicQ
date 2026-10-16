import prisma from "../../../lib/prisma";
import {
  AppointmentStatus,
  BookingChannel,
} from "../../../generated/prisma/client";
import type { AuditLogQuery, MetricsQuery } from "./admin.validation";

export class AdminService {
  static async getDashboardMetrics(clinicId: string, query: MetricsQuery = {}) {
    const now = new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default: past 7 days
    const to = query.to ? new Date(query.to) : now;

    const appointmentWhere: any = {
      slot: {
        doctor: {
          user: { clinicId },
        },
        startsAt: { gte: from, lte: to },
      },
    };

    if (query.doctorId) {
      appointmentWhere.slot.doctorId = query.doctorId;
    }

    const [appointments, doctors, traces] = await Promise.all([
      prisma.appointment.findMany({
        where: appointmentWhere,
        include: {
          slot: {
            select: { startsAt: true, endsAt: true, doctorId: true },
          },
        },
      }),
      prisma.doctorProfile.findMany({
        where: { user: { clinicId } },
        include: {
          user: { select: { email: true } },
          slots: {
            where: { startsAt: { gte: from, lte: to } },
            select: { id: true, status: true },
          },
        },
      }),
      prisma.assistantTrace.findMany({
        where: {
          clinicId,
          createdAt: { gte: from, lte: to },
        },
        select: { id: true, outcome: true, createdAt: true },
      }),
    ]);

    // 1. Status Breakdown
    const totalAppointments = appointments.length;
    let completed = 0;
    let checkedIn = 0;
    let booked = 0;
    let inConsultation = 0;
    let noShows = 0;
    let cancelled = 0;

    let manualBookings = 0;
    let assistantBookings = 0;
    let receptionBookings = 0;

    let totalWaitMs = 0;
    let waitCount = 0;

    let totalConsultMs = 0;
    let consultCount = 0;

    const dailyMap: Record<string, { date: string; total: number; completed: number; cancelled: number; noShow: number }> = {};

    for (const a of appointments) {
      if (a.status === AppointmentStatus.COMPLETED) completed++;
      else if (a.status === AppointmentStatus.CHECKED_IN) checkedIn++;
      else if (a.status === AppointmentStatus.BOOKED) booked++;
      else if (a.status === AppointmentStatus.IN_CONSULTATION) inConsultation++;
      else if (a.status === AppointmentStatus.NO_SHOW) noShows++;
      else if (a.status === AppointmentStatus.CANCELLED) cancelled++;

      if (a.bookedVia === BookingChannel.ASSISTANT) assistantBookings++;
      else if (a.bookedVia === BookingChannel.RECEPTION) receptionBookings++;
      else manualBookings++;

      // Wait time (from check-in to consultation start)
      if (a.checkedInAt && a.consultStartedAt) {
        totalWaitMs += a.consultStartedAt.getTime() - a.checkedInAt.getTime();
        waitCount++;
      }

      // Consult duration
      if (a.consultStartedAt && a.completedAt) {
        totalConsultMs += a.completedAt.getTime() - a.consultStartedAt.getTime();
        consultCount++;
      }

      // Daily trend
      const dateKey = a.slot.startsAt.toISOString().split("T")[0]!;
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, total: 0, completed: 0, cancelled: 0, noShow: 0 };
      }
      dailyMap[dateKey]!.total++;
      if (a.status === AppointmentStatus.COMPLETED) dailyMap[dateKey]!.completed++;
      if (a.status === AppointmentStatus.CANCELLED) dailyMap[dateKey]!.cancelled++;
      if (a.status === AppointmentStatus.NO_SHOW) dailyMap[dateKey]!.noShow++;
    }

    const appointmentsPerDay = Object.values(dailyMap).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const resolvedTotal = completed + noShows + cancelled;
    const noShowRate = resolvedTotal > 0 ? Number(((noShows / resolvedTotal) * 100).toFixed(1)) : 0;
    const cancellationRate = totalAppointments > 0 ? Number(((cancelled / totalAppointments) * 100).toFixed(1)) : 0;

    const averageWaitMinutes = waitCount > 0 ? Math.round(totalWaitMs / waitCount / (60 * 1000)) : 10;
    const averageConsultMinutes = consultCount > 0 ? Math.round(totalConsultMs / consultCount / (60 * 1000)) : 15;

    // 2. Doctor Utilization
    const doctorUtilization = doctors.map((doc) => {
      const totalSlots = doc.slots.length;
      const bookedSlots = doc.slots.filter((s) => s.status === "BOOKED").length;
      const utilizationRate =
        totalSlots > 0 ? Number(((bookedSlots / totalSlots) * 100).toFixed(1)) : 0;

      return {
        doctorId: doc.id,
        name: doc.user.email.split("@")[0],
        specialty: doc.specialty,
        totalSlots,
        bookedSlots,
        utilizationRate,
      };
    });

    // 3. AI Assistant Success Rate
    const totalTraces = traces.length;
    const successfulAssistantBookings = traces.filter((t) => t.outcome === "BOOKED_SUCCESSFULLY").length;
    const emergencyRedirects = traces.filter((t) => t.outcome === "EMERGENCY_REDIRECTED").length;
    const assistantSuccessRate =
      totalTraces > 0
        ? Number(((successfulAssistantBookings / totalTraces) * 100).toFixed(1))
        : 100;

    return {
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      summary: {
        totalAppointments,
        completed,
        checkedIn,
        inConsultation,
        booked,
        noShows,
        cancelled,
        noShowRate,
        cancellationRate,
        averageWaitMinutes,
        averageConsultMinutes,
      },
      bookingChannels: {
        manual: manualBookings,
        assistant: assistantBookings,
        reception: receptionBookings,
      },
      assistantMetrics: {
        totalConversations: totalTraces,
        successfulBookings: successfulAssistantBookings,
        emergencyRedirects,
        successRate: assistantSuccessRate,
      },
      appointmentsPerDay,
      doctorUtilization,
    };
  }

  static async getAuditLogs(clinicId: string, query: AuditLogQuery = { page: 1, limit: 50 }) {
    const { actorType, actorId, entity, action, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = { clinicId };
    if (actorType) where.actorType = actorType;
    if (actorId) where.actorId = actorId;
    if (entity) where.entity = entity;
    if (action) where.action = { contains: action, mode: "insensitive" };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
