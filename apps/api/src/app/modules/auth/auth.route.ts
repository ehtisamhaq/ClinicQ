import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../../config/env";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { AuthController } from "./auth.controller";
import { loginSchema, refreshTokenSchema, registerSchema } from "./auth.validation";

const router: IRouter = Router();

const loginLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  limit: env.LOGIN_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/register",
  validateRequest(registerSchema),
  AuthController.register,
);

router.post(
  "/login",
  loginLimiter,
  validateRequest(loginSchema),
  AuthController.login,
);

router.post(
  "/refresh",
  validateRequest(refreshTokenSchema),
  AuthController.refreshToken,
);

router.post(
  "/logout",
  AuthController.logout,
);

router.post(
  "/socket-token",
  checkAuth(),
  AuthController.socketToken,
);

router.get(
  "/me",
  checkAuth(),
  AuthController.getMe,
);

export const authRouter = router;
