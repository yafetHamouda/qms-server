var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoose from "mongoose";
import TicketProcess from "../models/TicketProcess.js";
import { getAllRedisStore } from "../utils/QueueHelper.js";
const TicketRequestSchema = new mongoose.Schema({
    ticketNumber: { type: Number, required: true },
    clientPhoneNumber: { type: Number, minLength: 8, maxLength: 8 },
    TicketNumberCurrentlyProcessed: { type: Number, required: true },
    currentQueueState: {
        type: [{ window: Number, ticket: Number }],
        required: true,
    },
    avgDurationOnSaveMS: Number,
    EtaMS: Number,
    EtaTime: Date,
}, { timestamps: true });
TicketRequestSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { currentInQueue, totalInQueue } = yield getAllRedisStore();
            const remainingInQueue = totalInQueue - currentInQueue;
            const aggResult = yield TicketProcess.aggregate([
                {
                    $group: {
                        _id: null,
                        avgDuration: { $avg: "$processDurationMS" },
                    },
                },
            ]).exec();
            // this check means that there is no logged ticket process duration yet so no need
            // to populate ETAs values
            if (aggResult.length === 0 || aggResult[0].avgDuration === null) {
                return;
            }
            const avgDurationOnSaveMS = Math.trunc(aggResult[0].avgDuration);
            const totalEtaDuration = remainingInQueue * avgDurationOnSaveMS;
            this.avgDurationOnSaveMS = avgDurationOnSaveMS;
            this.EtaMS = totalEtaDuration;
            this.EtaTime = new Date(new Date().getTime() + totalEtaDuration);
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
export default mongoose.model("TicketRequest", TicketRequestSchema);
//# sourceMappingURL=TicketRequest.js.map