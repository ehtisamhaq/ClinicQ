import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminService } from "./admin.service";
import type { AuditLogQuery, MetricsQuery } from "./admin.validation";

export class AdminController {
  static getDashboardMetrics = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;
    const query = req.query as unknown as MetricsQuery;
    const metrics = await AdminService.getDashboardMetrics(clinicId, query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Dashboard metrics retrieved successfully",
      data: metrics,
    });
  });

  static getAuditLogs = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;
    const query = req.query as unknown as AuditLogQuery;
    const result = await AdminService.getAuditLogs(clinicId, query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Audit logs retrieved successfully",
      data: result.logs,
      meta: result.meta,
    });
  });
}
