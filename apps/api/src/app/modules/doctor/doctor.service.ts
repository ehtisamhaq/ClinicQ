import prisma from "../../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { Role } from "../../../generated/prisma/client";
import type {
  DoctorQuery,
  CreateDoctorInput,
  UpdateDoctorInput,
  UpdateScheduleInput,
} from "./doctor.validation";

export class DoctorService {
  static async getDoctors(clinicId?: string, query: DoctorQuery = { page: 1, limit: 20 }) {
    const { specialty, gender, language, minFee, maxFee, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (clinicId) {
      where.user = { clinicId };
    }

    if (specialty) {
      where.specialty = { equals: specialty, mode: "insensitive" };
    }

    if (gender) {
      where.gender = { equals: gender, mode: "insensitive" };
    }

    if (language) {
      where.languages = { has: language.toLowerCase() };
    }

    if (minFee !== undefined || maxFee !== undefined) {
      where.consultationFee = {};
      if (minFee !== undefined) where.consultationFee.gte = minFee;
      if (maxFee !== undefined) where.consultationFee.lte = maxFee;
    }

    if (search) {
      where.OR = [
        { specialty: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, doctors] = await Promise.all([
      prisma.doctorProfile.count({ where }),
      prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { specialty: "asc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              preferredLanguage: true,
              clinicId: true,
            },
          },
          schedules: {
            orderBy: { weekday: "asc" },
          },
        },
      }),
    ]);

    return {
      doctors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getSpecialties(clinicId?: string) {
    const where = clinicId ? { user: { clinicId } } : {};
    const doctors = await prisma.doctorProfile.findMany({
      where,
      select: { specialty: true },
      distinct: ["specialty"],
      orderBy: { specialty: "asc" },
    });
    return doctors.map((d) => d.specialty);
  }

  static async getDoctorById(id: string, clinicId?: string) {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            preferredLanguage: true,
            clinicId: true,
            clinic: {
              select: { id: true, name: true, timezone: true },
            },
          },
        },
        schedules: {
          orderBy: { weekday: "asc" },
        },
      },
    });

    if (!doctor) {
      throw new AppError(404, "Doctor profile not found");
    }

    if (clinicId && doctor.user.clinicId !== clinicId) {
      throw new AppError(404, "Doctor not found in this clinic");
    }

    return doctor;
  }

  static async createDoctor(data: CreateDoctorInput, clinicId: string) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { doctorProfile: true },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    if (user.clinicId !== clinicId) {
      throw new AppError(403, "User belongs to another clinic");
    }

    if (user.doctorProfile) {
      throw new AppError(409, "Doctor profile already exists for this user");
    }

    // Ensure role is DOCTOR
    if (user.role !== Role.DOCTOR) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: Role.DOCTOR },
      });
    }

    const languages = data.languages.map((l) => l.toLowerCase());

    const profile = await prisma.doctorProfile.create({
      data: {
        userId: data.userId,
        specialty: data.specialty,
        bio: data.bio ?? null,
        gender: data.gender ?? null,
        languages,
        consultationFee: data.consultationFee,
        avgConsultMinutes: data.avgConsultMinutes || 15,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            preferredLanguage: true,
          },
        },
      },
    });

    return profile;
  }

  static async updateDoctor(
    id: string,
    data: UpdateDoctorInput,
    actor: { id: string; role: string; clinicId: string },
  ) {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!doctor) {
      throw new AppError(404, "Doctor profile not found");
    }

    if (actor.role !== Role.ADMIN && doctor.userId !== actor.id) {
      throw new AppError(403, "You can only update your own doctor profile");
    }

    if (doctor.user.clinicId !== actor.clinicId) {
      throw new AppError(403, "Unauthorized access across clinics");
    }

    const updateData: any = {};
    if (data.specialty !== undefined) updateData.specialty = data.specialty;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.languages !== undefined) {
      updateData.languages = data.languages.map((l) => l.toLowerCase());
    }
    if (data.consultationFee !== undefined) updateData.consultationFee = data.consultationFee;
    if (data.avgConsultMinutes !== undefined) updateData.avgConsultMinutes = data.avgConsultMinutes;

    const updated = await prisma.doctorProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, email: true, preferredLanguage: true },
        },
        schedules: true,
      },
    });

    return updated;
  }

  static async getDoctorSchedules(doctorId: string) {
    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId },
      orderBy: { weekday: "asc" },
    });
    return schedules;
  }

  static async updateDoctorSchedules(
    doctorId: string,
    data: UpdateScheduleInput,
    actor: { id: string; role: string; clinicId: string },
  ) {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      throw new AppError(404, "Doctor profile not found");
    }

    if (actor.role !== Role.ADMIN && doctor.userId !== actor.id) {
      throw new AppError(403, "You can only update your own schedule");
    }

    if (doctor.user.clinicId !== actor.clinicId) {
      throw new AppError(403, "Unauthorized access across clinics");
    }

    // Replace all schedules inside a transaction
    const updatedSchedules = await prisma.$transaction(async (tx) => {
      await tx.doctorSchedule.deleteMany({
        where: { doctorId },
      });

      if (data.schedules.length === 0) {
        return [];
      }

      await tx.doctorSchedule.createMany({
        data: data.schedules.map((s) => ({
          doctorId,
          weekday: s.weekday,
          startTime: s.startTime,
          endTime: s.endTime,
          slotMinutes: s.slotMinutes || doctor.avgConsultMinutes,
        })),
      });

      return tx.doctorSchedule.findMany({
        where: { doctorId },
        orderBy: { weekday: "asc" },
      });
    });

    return updatedSchedules;
  }
}
