import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { authRouter } from "../modules/auth/auth.route";
import { doctorRouter } from "../modules/doctor/doctor.route";
import { slotRouter } from "../modules/slot/slot.route";
import { publicRouter } from "../modules/public/public.route";

const router: IRouter = Router();

// Health check
router.use("/", healthRouter);

// Auth module
router.use("/auth", authRouter);

// Doctor and schedule module
router.use("/doctors", doctorRouter);

// Slot module
router.use("/slots", slotRouter);

// Public browsing endpoints
router.use("/public", publicRouter);

export default router;
