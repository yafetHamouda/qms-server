import { Router } from "express";
import windowAuth from "../middlewares/windowAuth.js";
import {
  requestNewTicket,
  processNextTicket,
  resetQueue,
} from "../controllers/QueueController.js";
const router = Router();

router.get("/", windowAuth, processNextTicket);
//TODO: Add token security here
router.post("/", requestNewTicket);
router.delete("/", resetQueue);

export default router;
