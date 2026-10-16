import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { authRouter } from "../modules/auth/auth.route";
import { doctorRouter } from "../modules/doctor/doctor.route";
import { slotRouter } from "../modules/slot/slot.route";
import { publicRouter } from "../modules/public/public.route";

import { appointmentRouter } from "../modules/appointment/appointment.route";
import { queueRouter } from "../modules/queue/queue.route";
import { assistantRouter } from "../modules/assistant/assistant.route";

const router: IRouter = Router();

// Health check
router.use("/", healthRouter);

// Auth module
router.use("/auth", authRouter);

// Doctor and schedule module
router.use("/doctors", doctorRouter);

// Slot module
router.use("/slots", slotRouter);

// Appointment module
router.use("/appointments", appointmentRouter);

// Queue module
router.use("/queue", queueRouter);

// Assistant AI module
router.use("/assistant", assistantRouter);

// Public browsing endpoints
router.use("/public", publicRouter);

export default router;
