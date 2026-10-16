import { Router, type IRouter } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { AppointmentController } from "./appointment.controller";
import {
  bookAppointmentSchema,
  appointmentQuerySchema,
  appointmentIdParamSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
} from "./appointment.validation";

const router: IRouter = Router();

router.post(
  "/",
  checkAuth(),
  validateRequest(bookAppointmentSchema),
  AppointmentController.bookAppointment,
);

router.get(
  "/",
  checkAuth(),
  validateRequest(appointmentQuerySchema),
  AppointmentController.getAppointments,
);

router.get(
  "/:id",
  checkAuth(),
  validateRequest(appointmentIdParamSchema),
  AppointmentController.getAppointmentById,
);

router.patch(
  "/:id/reschedule",
  checkAuth(),
  validateRequest(rescheduleAppointmentSchema),
  AppointmentController.reschedule,
);

router.patch(
  "/:id/cancel",
  checkAuth(),
  validateRequest(appointmentIdParamSchema),
  AppointmentController.cancel,
);

router.patch(
  "/:id/status",
  checkAuth(),
  validateRequest(updateAppointmentStatusSchema),
  AppointmentController.updateStatus,
);

export const appointmentRouter = router;
