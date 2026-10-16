import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppointmentService } from "./appointment.service";

export class AppointmentController {
  static bookAppointment = catchAsync(async (req: Request, res: Response) => {
    const actor = req.user!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

    const appointment = await AppointmentService.book(req.body, actor, idempotencyKey);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  });

  static getAppointments = catchAsync(async (req: Request, res: Response) => {
    const actor = req.user!;
    const result = await AppointmentService.getAppointments(actor, req.query as any);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Appointments retrieved successfully",
      data: result.appointments,
      meta: result.meta,
    });
  });

  static getAppointmentById = catchAsync(async (req: Request, res: Response) => {
    const actor = req.user!;
    const id = req.params.id as string;
    const appointment = await AppointmentService.getAppointmentById(id, actor);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Appointment retrieved successfully",
      data: appointment,
    });
  });

  static reschedule = catchAsync(async (req: Request, res: Response) => {
    const actor = req.user!;
    const id = req.params.id as string;
    const { newSlotId } = req.body;

    const updated = await AppointmentService.reschedule(id, newSlotId, actor);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Appointment rescheduled successfully",
      data: updated,
    });
  });

  static cancel = catchAsync(async (req: Request, res: Response) => {
    const actor = req.user!;
    const id = req.params.id as string;
    const { reason } = req.body || {};

    const updated = await AppointmentService.cancel(id, actor, reason);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Appointment cancelled successfully",
      data: updated,
    });
  });

  static updateStatus = catchAsync(async (req: Request, res: Response) => {
    const actor = req.user!;
    const id = req.params.id as string;
    const { status, reason } = req.body;

    const updated = await AppointmentService.updateStatus(id, status, actor, reason);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Appointment status updated to ${status}`,
      data: updated,
    });
  });
}
