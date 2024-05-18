import mongoose from "mongoose";
const TicketProcessSchema = new mongoose.Schema({
    TicketNumberToProccess: { type: Number, required: true },
    windowToProcess: { type: Number, required: true },
    currentQueueState: {
        type: [{ window: Number, ticket: Number }],
        required: true,
    },
    processDurationMS: Number,
    closedAt: Date,
}, { timestamps: true });
export default mongoose.model("TicketProcess", TicketProcessSchema);
//# sourceMappingURL=TicketProcess.js.map