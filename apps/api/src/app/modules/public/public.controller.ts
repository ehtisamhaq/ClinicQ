import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { DoctorService } from "../doctor/doctor.service";
import { SlotService } from "../slot/slot.service";

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
}
