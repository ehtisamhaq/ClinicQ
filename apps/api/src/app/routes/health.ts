import { Router, IRouter } from "express";

const router: IRouter = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "ClinicQ API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export default router;
