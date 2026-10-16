import { Router, IRouter } from "express";
import healthRouter from "./health";

const router: IRouter = Router();

// Mount all module routers here as they are built
router.use("/", healthRouter);

// Future module routes will be added below:
// router.use("/auth", authRouter);
// router.use("/doctors", doctorRouter);
// etc.

export default router;
