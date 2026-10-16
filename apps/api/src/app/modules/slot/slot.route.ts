import { Router, type IRouter } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { SlotController } from "./slot.controller";
import {
  slotQuerySchema,
  slotIdParamSchema,
  generateSlotsSchema,
} from "./slot.validation";

const router: IRouter = Router();

router.get(
  "/",
  validateRequest(slotQuerySchema),
  SlotController.getSlots,
);

router.get(
  "/doctor/:id",
  SlotController.getDoctorSlots,
);

router.post(
  "/generate",
  checkAuth("ADMIN", "DOCTOR"),
  validateRequest(generateSlotsSchema),
  SlotController.generateSlots,
);

router.patch(
  "/:id/block",
  checkAuth("ADMIN", "DOCTOR"),
  validateRequest(slotIdParamSchema),
  SlotController.blockSlot,
);

router.patch(
  "/:id/unblock",
  checkAuth("ADMIN", "DOCTOR"),
  validateRequest(slotIdParamSchema),
  SlotController.unblockSlot,
);

export const slotRouter = router;
