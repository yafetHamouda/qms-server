import mongoose, { CallbackError } from "mongoose";
import TicketProcess from "../models/TicketProcess.js";

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
    avgDurationOnSave: Number,
  },
  { timestamps: true }
);

TicketRequestSchema.pre("save", async function (next) {
  try {
    const aggResult = await TicketProcess.aggregate([
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$processDurationMS" },
        },
      },
    ]).exec();

    this.avgDurationOnSave = Math.trunc(aggResult[0].avgDuration);

    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

export default mongoose.model("TicketRequest", TicketRequestSchema);
