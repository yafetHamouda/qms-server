import mongoose, { CallbackError } from "mongoose";
import TicketProcess from "../models/TicketProcess.js";
import { getAllRedisStore } from "../utils/QueueHelper.js";

const TicketRequestSchema = new mongoose.Schema(
  {
    ticketNumber: { type: Number, required: true },
    clientName: { type: String, minLength: 3, maxLength: 30, required: true },
    clientPhoneNumber: { type: Number, min: 8, max: 8 },
    TicketNumberCurrentlyProcessed: { type: Number, required: true },
    currentQueueState: {
      type: [{ window: Number, ticket: Number }],
      required: true,
    },
    avgDurationOnSaveMS: Number,
    EtaMS: Number,
    EtaTime: Date,
  },
  { timestamps: true }
);

TicketRequestSchema.pre("save", async function (next) {
  try {
    const { currentInQueue, totalInQueue } = await getAllRedisStore();
    const remainingInQueue = totalInQueue - currentInQueue;

    const aggResult = await TicketProcess.aggregate([
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
  } catch (error) {
    next(error as CallbackError);
  }
});

export default mongoose.model("TicketRequest", TicketRequestSchema);
