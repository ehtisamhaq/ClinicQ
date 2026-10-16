import { Router, type IRouter } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { AdminController } from "./admin.controller";
import {
  auditLogQuerySchema,
  metricsQuerySchema,
} from "./admin.validation";

const router: IRouter = Router();

router.get(
  "/metrics",
  checkAuth("ADMIN"),
  validateRequest(metricsQuerySchema),
  AdminController.getDashboardMetrics,
);

router.get(
  "/audit-logs",
  checkAuth("ADMIN"),
  validateRequest(auditLogQuerySchema),
  AdminController.getAuditLogs,
);

export const adminRouter = router;
