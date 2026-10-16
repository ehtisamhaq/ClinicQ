import { Router, type IRouter } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { QueueController } from "./queue.controller";

const router: IRouter = Router();

router.get("/doctor/:doctorId", QueueController.getDoctorQueue);
router.get("/clinic", checkAuth("RECEPTIONIST", "ADMIN"), QueueController.getClinicQueue);

export const queueRouter = router;
