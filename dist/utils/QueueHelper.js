var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { redisClient } from "../bin/www.js";
const getAllRedisStore = () => __awaiter(void 0, void 0, void 0, function* () {
    const redisStore = yield redisClient.mGet(["totalInQueue", "currentInQueue"]);
    const [totalInQueue, currentInQueue] = redisStore;
    const mapped = {
        totalInQueue: Number(totalInQueue || 0),
        currentInQueue: Number(currentInQueue || 0),
    };
    return mapped;
});
const generateQueueStatus = () => __awaiter(void 0, void 0, void 0, function* () {
    const windowsKeys = yield redisClient.keys("window:*");
    const windowsState = yield Promise.all(windowsKeys.map((w) => redisClient.get(w)));
    const queueState = windowsKeys
        .map((e) => e.split(":")[1])
        .map((e, index) => {
        return {
            window: Number(e),
            ticket: Number(windowsState[index]),
        };
    })
        .sort((a, b) => a.window - b.window);
    return queueState;
});
export { generateQueueStatus, getAllRedisStore };
//# sourceMappingURL=QueueHelper.js.map