import mongoose, { CallbackError } from "mongoose";
import { getAllRedisStore } from "../utils/QueueHelper.js";

const TicketSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

TicketSchema.pre("save", async function (next) {
  try {
    const { currentInQueue, totalInQueue } = await getAllRedisStore();
    const remainingInQueue = totalInQueue - currentInQueue;

    const aggResult = await TicketModel.aggregate([
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

const TicketModel = mongoose.model("Ticket", TicketSchema);
export default TicketModel;
