import prisma from "../../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { Role, SlotStatus } from "../../../generated/prisma/client";
import type { GenerateSlotsInput, SlotQuery } from "./slot.validation";

export class SlotService {
  static async getSlots(query: SlotQuery = { page: 1, limit: 50 }) {
    const { doctorId, clinicId, from, to, status, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (clinicId) {
      where.doctor = { user: { clinicId } };
    }

    if (status) {
      where.status = status;
    }

    if (from || to) {
      where.startsAt = {};
      if (from) where.startsAt.gte = new Date(from);
      if (to) where.startsAt.lte = new Date(to);
    }

    const [total, slots] = await Promise.all([
      prisma.slot.count({ where }),
      prisma.slot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startsAt: "asc" },
        include: {
          doctor: {
            select: {
              id: true,
              specialty: true,
              consultationFee: true,
              avgConsultMinutes: true,
              user: {
                select: { id: true, email: true, preferredLanguage: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      slots,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getAvailableSlots(doctorId: string, from?: Date, to?: Date) {
    const now = new Date();
    const effectiveFrom = from && from > now ? from : now;

    const where: any = {
      doctorId,
      status: SlotStatus.AVAILABLE,
      startsAt: { gte: effectiveFrom },
    };

    if (to) {
      where.startsAt.lte = to;
    }

    const slots = await prisma.slot.findMany({
      where,
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        doctorId: true,
        startsAt: true,
        endsAt: true,
        status: true,
      },
    });

    return slots;
  }

  static async generateSlots(
    data: GenerateSlotsInput,
    actor: { id: string; role: string; clinicId: string },
  ) {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: data.doctorId },
      include: {
        user: true,
        schedules: true,
      },
    });

    if (!doctor) {
      throw new AppError(404, "Doctor profile not found");
    }

    if (actor.role !== Role.ADMIN && doctor.userId !== actor.id) {
      throw new AppError(403, "You can only generate slots for your own profile");
    }

    if (doctor.user.clinicId !== actor.clinicId) {
      throw new AppError(403, "Doctor belongs to another clinic");
    }

    if (doctor.schedules.length === 0) {
      throw new AppError(400, "Doctor has no weekly schedule configured");
    }

    const [startYear, startMonth, startDay] = data.startDate.split("-").map(Number);
    const [endYear, endMonth, endDay] = data.endDate.split("-").map(Number);

    const start = new Date(Date.UTC(startYear!, startMonth! - 1, startDay!));
    const end = new Date(Date.UTC(endYear!, endMonth! - 1, endDay!, 23, 59, 59));

    if (start > end) {
      throw new AppError(400, "startDate cannot be after endDate");
    }

    let generatedCount = 0;
    const current = new Date(start);

    while (current <= end) {
      const weekday = current.getUTCDay();
      const schedule = doctor.schedules.find((s) => s.weekday === weekday);

      if (schedule) {
        const [startH, startM] = schedule.startTime.split(":").map(Number);
        const [endH, endM] = schedule.endTime.split(":").map(Number);
        const slotDuration = data.slotMinutes || schedule.slotMinutes || doctor.avgConsultMinutes;

        const slotStartTime = new Date(current);
        slotStartTime.setUTCHours(startH!, startM!, 0, 0);

        const slotEndTimeLimit = new Date(current);
        slotEndTimeLimit.setUTCHours(endH!, endM!, 0, 0);

        let iterTime = new Date(slotStartTime);
        while (iterTime.getTime() + slotDuration * 60 * 1000 <= slotEndTimeLimit.getTime()) {
          const slotEnd = new Date(iterTime.getTime() + slotDuration * 60 * 1000);

          await prisma.slot.upsert({
            where: {
              doctorId_startsAt: {
                doctorId: doctor.id,
                startsAt: iterTime,
              },
            },
            update: {},
            create: {
              doctorId: doctor.id,
              startsAt: iterTime,
              endsAt: slotEnd,
              status: SlotStatus.AVAILABLE,
            },
          });

          generatedCount++;
          iterTime = new Date(iterTime.getTime() + slotDuration * 60 * 1000);
        }
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    return {
      doctorId: doctor.id,
      generatedCount,
      startDate: data.startDate,
      endDate: data.endDate,
    };
  }

  static async blockSlot(
    slotId: string,
    actor: { id: string; role: string; clinicId: string },
  ) {
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: { doctor: { include: { user: true } } },
    });

    if (!slot) {
      throw new AppError(404, "Slot not found");
    }

    if (actor.role !== Role.ADMIN && slot.doctor.userId !== actor.id) {
      throw new AppError(403, "Permission denied");
    }

    if (slot.doctor.user.clinicId !== actor.clinicId) {
      throw new AppError(403, "Slot belongs to another clinic");
    }

    if (slot.status === SlotStatus.BOOKED) {
      throw new AppError(400, "Cannot block an already booked slot");
    }

    const updated = await prisma.slot.update({
      where: { id: slotId },
      data: { status: SlotStatus.BLOCKED },
    });

    return updated;
  }

  static async unblockSlot(
    slotId: string,
    actor: { id: string; role: string; clinicId: string },
  ) {
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: { doctor: { include: { user: true } } },
    });

    if (!slot) {
      throw new AppError(404, "Slot not found");
    }

    if (actor.role !== Role.ADMIN && slot.doctor.userId !== actor.id) {
      throw new AppError(403, "Permission denied");
    }

    if (slot.doctor.user.clinicId !== actor.clinicId) {
      throw new AppError(403, "Slot belongs to another clinic");
    }

    if (slot.status !== SlotStatus.BLOCKED) {
      throw new AppError(400, "Slot is not currently blocked");
    }

    const updated = await prisma.slot.update({
      where: { id: slotId },
      data: { status: SlotStatus.AVAILABLE },
    });

    return updated;
  }
}
