import type { Request, Response } from "express";
import prisma from "../../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { DoctorService } from "../doctor/doctor.service";
import { SlotService } from "../slot/slot.service";
import { AppointmentStatus } from "../../../generated/prisma/client";

export class PublicController {
  static getClinicDoctors = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.params.clinicId as string;
    const result = await DoctorService.getDoctors(clinicId, req.query as any);

    // Sanitize to public-safe fields only
    const publicDoctors = result.doctors.map((d) => ({
      id: d.id,
      specialty: d.specialty,
      bio: d.bio,
      gender: d.gender,
      languages: d.languages,
      consultationFee: d.consultationFee,
      avgConsultMinutes: d.avgConsultMinutes,
      email: d.user.email,
    }));

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Public doctors retrieved successfully",
      data: publicDoctors,
      meta: result.meta,
    });
  });

  static getSpecialties = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.query.clinicId as string | undefined;
    const specialties = await DoctorService.getSpecialties(clinicId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Specialties retrieved successfully",
      data: specialties,
    });
  });

  static getDoctorSchedule = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const schedules = await DoctorService.getDoctorSchedules(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Doctor schedule retrieved successfully",
      data: schedules,
    });
  });

  static getDoctorSlots = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;

    const slots = await SlotService.getAvailableSlots(id, from, to);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Available slots retrieved successfully",
      data: slots,
    });
  });

  static trackAppointment = catchAsync(async (req: Request, res: Response) => {
    const token = req.params.token as string;
    const appointment = await prisma.appointment.findUnique({
      where: { trackingToken: token },
      include: {
        slot: {
          include: {
            doctor: {
              include: {
                user: { select: { email: true } },
              },
            },
          },
        },
        patient: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!appointment) {
      throw new AppError(404, "Invalid or expired tracking link");
    }

    let aheadCount = 0;
    if (appointment.status === AppointmentStatus.CHECKED_IN && appointment.checkedInAt) {
      aheadCount = await prisma.appointment.count({
        where: {
          slot: { doctorId: appointment.slot.doctorId },
          status: AppointmentStatus.CHECKED_IN,
          checkedInAt: { lt: appointment.checkedInAt },
        },
      });
    }

    const emailPrefix = appointment.patient.user.email.split("@")[0] || "";
    const initials =
      emailPrefix
        .split(/[._-]/)
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .join(".") + ".";

    const waitMinutes = aheadCount * (appointment.slot.doctor.avgConsultMinutes || 15);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Queue tracking details retrieved",
      data: {
        status: appointment.status,
        queuePosition: appointment.status === AppointmentStatus.CHECKED_IN ? aheadCount + 1 : null,
        patientsAhead: aheadCount,
        estimatedWaitMinutes: waitMinutes,
        doctor: {
          specialty: appointment.slot.doctor.specialty,
          consultationFee: appointment.slot.doctor.consultationFee,
          email: appointment.slot.doctor.user.email,
        },
        slot: {
          startsAt: appointment.slot.startsAt,
          endsAt: appointment.slot.endsAt,
        },
        patientInitials: initials,
        checkedInAt: appointment.checkedInAt,
        consultStartedAt: appointment.consultStartedAt,
        completedAt: appointment.completedAt,
      },
    });
  });
}
