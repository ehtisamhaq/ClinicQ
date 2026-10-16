import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { WaitlistService } from "./waitlist.service";

export class WaitlistController {
  static join = catchAsync(async (req: Request, res: Response) => {
    const actor = req.user!;
    const entry = await WaitlistService.join(req.body, actor);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Added to waitlist successfully",
      data: entry,
    });
  });

  static getWaitlist = catchAsync(async (req: Request, res: Response) => {
    const actor = req.user!;
    const result = await WaitlistService.getWaitlist(actor, req.query as any);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Waitlist entries retrieved successfully",
      data: result.entries,
      meta: result.meta,
    });
  });

  static leave = catchAsync(async (req: Request, res: Response) => {
    const actor = req.user!;
    const id = req.params.id as string;
    await WaitlistService.leave(id, actor);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Removed from waitlist successfully",
    });
  });
}
