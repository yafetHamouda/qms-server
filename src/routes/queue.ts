import { Router } from "express";
import authCheck from "../middlewares/authCheck.js";
import {
  requestNewTicket,
  processNextTicket,
  resetQueue,
} from "../controllers/QueueController.js";
const router = Router();

router.get("/", authCheck, processNextTicket);
router.post("/", authCheck, requestNewTicket);
router.delete("/", authCheck, resetQueue);

export default router;
