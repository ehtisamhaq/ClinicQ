import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { PublicController } from "./public.controller";

const router: IRouter = Router();

const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 60, // 60 requests per minute
  message: {
    success: false,
    message: "Too many tracking status requests. Please try again in a moment.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/clinics/:clinicId/doctors", PublicController.getClinicDoctors);
router.get("/specialties", PublicController.getSpecialties);
router.get("/doctors/:id/schedule", PublicController.getDoctorSchedule);
router.get("/doctors/:id/slots", PublicController.getDoctorSlots);
router.get("/track/:token", trackingLimiter, PublicController.trackAppointment);

export const publicRouter = router;
