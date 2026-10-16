import { Router, type IRouter } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { DoctorController } from "./doctor.controller";
import {
  doctorQuerySchema,
  doctorIdParamSchema,
  createDoctorSchema,
  updateDoctorSchema,
  updateScheduleSchema,
} from "./doctor.validation";

const router: IRouter = Router();

router.get(
  "/",
  validateRequest(doctorQuerySchema),
  DoctorController.getDoctors,
);

router.get(
  "/specialties",
  DoctorController.getSpecialties,
);

router.get(
  "/:id",
  validateRequest(doctorIdParamSchema),
  DoctorController.getDoctorById,
);

router.post(
  "/",
  checkAuth("ADMIN"),
  validateRequest(createDoctorSchema),
  DoctorController.createDoctor,
);

router.put(
  "/:id",
  checkAuth("ADMIN", "DOCTOR"),
  validateRequest(updateDoctorSchema),
  DoctorController.updateDoctor,
);

router.get(
  "/:id/schedules",
  validateRequest(doctorIdParamSchema),
  DoctorController.getDoctorSchedules,
);

router.put(
  "/:id/schedules",
  checkAuth("ADMIN", "DOCTOR"),
  validateRequest(updateScheduleSchema),
  DoctorController.updateDoctorSchedules,
);

export const doctorRouter = router;
