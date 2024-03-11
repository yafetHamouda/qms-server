import mongoose from "mongoose";

const TicketRequestSchema = new mongoose.Schema(
  {
    ticketNumber: { type: Number, required: true },
    clientName: { type: String, minLength: 3, maxLength: 30, required: true },
    clientPhoneNumber: { type: Number, min: 8, max: 8 },
    currentProcessedTicketNumber: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", TicketRequestSchema);
