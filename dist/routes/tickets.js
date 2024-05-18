var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Router } from "express";
import { redisClient } from "../bin/www.js";
const router = Router();
/* GET tickets listing. */
router.get("/", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const totalInQueue = yield redisClient.get("totalInQueue");
        res.send(`Number of total tickets in queue is ${totalInQueue || 0}`);
    });
});
/* Post a new ticket to queue. */
router.post("/", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield redisClient.set("totalInQueue", 20);
        res.send("Added ticket to queue");
    });
});
export default router;
//# sourceMappingURL=tickets.js.map