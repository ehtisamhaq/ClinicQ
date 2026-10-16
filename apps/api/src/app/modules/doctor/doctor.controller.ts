import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { DoctorService } from "./doctor.service";

export class DoctorController {
  static getDoctors = catchAsync(async (req: Request, res: Response) => {
    // Optional clinic scoping: if authenticated, scope to clinicId, else query param or all
    const clinicId = req.user?.clinicId || (req.query.clinicId as string | undefined);
    const result = await DoctorService.getDoctors(clinicId, req.query as any);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Doctors retrieved successfully",
      data: result.doctors,
      meta: result.meta,
    });
  });

  static getSpecialties = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user?.clinicId || (req.query.clinicId as string | undefined);
    const specialties = await DoctorService.getSpecialties(clinicId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Specialties retrieved successfully",
      data: specialties,
    });
  });

  static getDoctorById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const clinicId = req.user?.clinicId;
    const doctor = await DoctorService.getDoctorById(id, clinicId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Doctor profile retrieved successfully",
      data: doctor,
    });
  });

  static createDoctor = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;
    const doctor = await DoctorService.createDoctor(req.body, clinicId);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Doctor profile created successfully",
      data: doctor,
    });
  });

  static updateDoctor = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const actor = req.user!;
    const updated = await DoctorService.updateDoctor(id, req.body, actor);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Doctor profile updated successfully",
      data: updated,
    });
  });

  static getDoctorSchedules = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const schedules = await DoctorService.getDoctorSchedules(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Doctor schedules retrieved successfully",
      data: schedules,
    });
  });

  static updateDoctorSchedules = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const actor = req.user!;
    const schedules = await DoctorService.updateDoctorSchedules(id, req.body, actor);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Doctor schedules updated successfully",
      data: schedules,
    });
  });
}
