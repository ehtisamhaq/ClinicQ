import { Router, type IRouter } from "express";
import { PublicController } from "./public.controller";

const router: IRouter = Router();

router.get("/clinics/:clinicId/doctors", PublicController.getClinicDoctors);
router.get("/specialties", PublicController.getSpecialties);
router.get("/doctors/:id/schedule", PublicController.getDoctorSchedule);
router.get("/doctors/:id/slots", PublicController.getDoctorSlots);

export const publicRouter = router;
