import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { authRouter } from "../modules/auth/auth.route";

const router: IRouter = Router();

// Health check
router.use("/", healthRouter);

// Auth module
router.use("/auth", authRouter);

export default router;
