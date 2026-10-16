import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { QueueService } from "./queue.service";

export class QueueController {
  static getDoctorQueue = catchAsync(async (req: Request, res: Response) => {
    const doctorId = req.params.doctorId as string;
    const clinicId = req.user?.clinicId;

    const queue = await QueueService.getDoctorQueue(doctorId, clinicId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Doctor queue retrieved successfully",
      data: queue,
    });
  });

  static getClinicQueue = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;
    const overview = await QueueService.getClinicQueueOverview(clinicId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Clinic queue overview retrieved successfully",
      data: overview,
    });
  });
}
