import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SlotService } from "./slot.service";

export class SlotController {
  static getSlots = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user?.clinicId || (req.query.clinicId as string | undefined);
    const query = {
      ...req.query,
      clinicId: clinicId || (req.query.clinicId as string | undefined),
    };
    const result = await SlotService.getSlots(query as any);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Slots retrieved successfully",
      data: result.slots,
      meta: result.meta,
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
      message: "Doctor available slots retrieved successfully",
      data: slots,
    });
  });

  static generateSlots = catchAsync(async (req: Request, res: Response) => {
    const actor = req.user!;
    const result = await SlotService.generateSlots(req.body, actor);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Slots generated successfully",
      data: result,
    });
  });

  static blockSlot = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const actor = req.user!;
    const slot = await SlotService.blockSlot(id, actor);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Slot blocked successfully",
      data: slot,
    });
  });

  static unblockSlot = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const actor = req.user!;
    const slot = await SlotService.unblockSlot(id, actor);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Slot unblocked successfully",
      data: slot,
    });
  });
}
