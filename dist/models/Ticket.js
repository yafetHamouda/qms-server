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
import { getAllRedisStore } from "../utils/QueueHelper.js";
const TicketSchema = new mongoose.Schema({
    // TICKET IS PROCESSED AND CLOSED
    processed: { type: Boolean, requied: true, default: false },
    // THE NUMBER ASSIGNED TO TICKET
    ticketNumber: { type: Number, required: true },
    // THE NUMBER OF TICKET BEING PROCESSED WHEN THIS NEW TICKED IS CREATED
    TicketNumberProcessedWhenOpened: { type: Number, required: true },
    // THE QUEUE STATE WHEN THIS NEW TICKET IS CREATED
    QueueStateWhenOpened: {
        type: [{ window: Number, ticket: Number }],
        required: true,
    },
    // WINDOW NUMBER THAT PROCESS THE TICKET
    processedByWindow: { type: Number },
    // THE QUEUE STATE WHEN THIS NEW TICKET IS STARTED BEING PROCESSED
    QueueStateWhenStartedProcessing: {
        type: [{ window: Number, ticket: Number }],
        default: undefined,
    },
    // THE AVERAGE TIME NEEDED FOR A TICKET PROCESS
    avgDurationOnSaveMS: Number,
    // THE TOTAL ESTIMATED TIME OF ARRIVAL FOR THIS TICKET TO GET PROCESSED IN MILLISECONDS
    EtaMS: Number,
    // THE ESTIMATED DATE OF ARRIVAL FOR THIS TICKET TO GET PROCESSED
    EtaTime: Date,
    // THE DURATION IT TOOK FOR THIS TICKET TO GET PROCESSED IN MILLISECONDS
    processDurationMS: Number,
    // THE TIME WHEN THIS TICKET WAS PROCESSED AND CLOSED
    closedAt: Date,
}, { timestamps: true });
TicketSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { currentInQueue, totalInQueue } = yield getAllRedisStore();
            const remainingInQueue = totalInQueue - currentInQueue;
            const aggResult = yield TicketModel.aggregate([
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
const TicketModel = mongoose.model("Ticket", TicketSchema);
export default TicketModel;
//# sourceMappingURL=Ticket.js.map