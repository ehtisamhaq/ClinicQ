import { Router, type IRouter } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { WaitlistController } from "./waitlist.controller";
import {
  joinWaitlistSchema,
  waitlistIdParamSchema,
  waitlistQuerySchema,
} from "./waitlist.validation";

const router: IRouter = Router();

router.post(
  "/",
  checkAuth(),
  validateRequest(joinWaitlistSchema),
  WaitlistController.join,
);

router.get(
  "/",
  checkAuth(),
  validateRequest(waitlistQuerySchema),
  WaitlistController.getWaitlist,
);

router.delete(
  "/:id",
  checkAuth(),
  validateRequest(waitlistIdParamSchema),
  WaitlistController.leave,
);

export const waitlistRouter = router;
