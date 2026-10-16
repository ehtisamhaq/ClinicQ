import { Router, type IRouter } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { AssistantController } from "./assistant.controller";
import { chatRequestSchema } from "./types";

const router: IRouter = Router();

router.post(
  "/chat",
  checkAuth("PATIENT", "RECEPTIONIST", "ADMIN"),
  validateRequest(chatRequestSchema),
  AssistantController.chat,
);

router.get(
  "/traces",
  checkAuth("ADMIN"),
  AssistantController.getTraces,
);

router.get(
  "/traces/:id",
  checkAuth(),
  AssistantController.getTraceById,
);

export const assistantRouter = router;
