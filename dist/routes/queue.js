import { Router } from "express";
import authCheck from "../middlewares/authCheck.js";
import bodyDataCheck from "../middlewares/bodyDataCheck.js";
import storeProcessedTime from "../middlewares/storeProcessedTime.js";
import { requestNewTicket, processNextTicket, resetQueue, exitQueue, } from "../controllers/QueueController.js";
const router = Router();
router.post("/next", authCheck, bodyDataCheck, storeProcessedTime, processNextTicket);
router.post("/exit", authCheck, bodyDataCheck, storeProcessedTime, exitQueue);
router.post("/", authCheck, requestNewTicket);
router.delete("/", authCheck, resetQueue);
export default router;
//# sourceMappingURL=queue.js.map