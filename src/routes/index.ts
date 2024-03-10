import { Router } from "express";
import { getQueueStatus } from "../controllers/QueueController.js";

const router = Router();

router.get("/", getQueueStatus);

export default router;
