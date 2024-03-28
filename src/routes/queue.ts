import { Router } from "express";
import authCheck from "../middlewares/authCheck.js";
import bodyDataCheck from "../middlewares/bodyDataCheck.js";
import storeProcessedTime from "../middlewares/storeProcessedTime.js";
import {
  requestNewTicket,
  processNextTicket,
  resetQueue,
} from "../controllers/QueueController.js";
const router = Router();

router.get(
  "/",
  authCheck,
  bodyDataCheck,
  storeProcessedTime,
  processNextTicket
);
router.post("/", authCheck, requestNewTicket);
router.delete("/", authCheck, resetQueue);

export default router;
