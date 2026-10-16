import { Router, type IRouter } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { KnowledgeController } from "./knowledge.controller";
import {
  createKnowledgeDocSchema,
  updateKnowledgeDocSchema,
  knowledgeIdParamSchema,
  searchKnowledgeSchema,
  listKnowledgeQuerySchema,
} from "./knowledge.validation";

const router: IRouter = Router();

router.post(
  "/",
  checkAuth("ADMIN"),
  validateRequest(createKnowledgeDocSchema),
  KnowledgeController.createDoc,
);

router.get(
  "/",
  checkAuth("ADMIN", "RECEPTIONIST"),
  validateRequest(listKnowledgeQuerySchema),
  KnowledgeController.getDocs,
);

router.get(
  "/:id",
  checkAuth("ADMIN", "RECEPTIONIST"),
  validateRequest(knowledgeIdParamSchema),
  KnowledgeController.getDocById,
);

router.put(
  "/:id",
  checkAuth("ADMIN"),
  validateRequest(updateKnowledgeDocSchema),
  KnowledgeController.updateDoc,
);

router.delete(
  "/:id",
  checkAuth("ADMIN"),
  validateRequest(knowledgeIdParamSchema),
  KnowledgeController.deleteDoc,
);

router.post(
  "/search",
  validateRequest(searchKnowledgeSchema),
  KnowledgeController.search,
);

export const knowledgeRouter = router;
