import { Response, Request, NextFunction } from "express";
import TicketProcess from "../models/TicketProcess.js";

export default async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { windowNumber } = req.body;

    // insert process duration for last ticket processed by the window making request
    const previouslyProcessedTicketByWindow = await TicketProcess.findOne(
      {
        windowToProcess: windowNumber,
      },
      null,
      { sort: { _id: -1 } }
    ).exec();

    if (
      previouslyProcessedTicketByWindow &&
      !previouslyProcessedTicketByWindow.processDurationMS
    ) {
      const processDurationMS =
        new Date().getTime() -
        previouslyProcessedTicketByWindow.createdAt.getTime();

      await TicketProcess.findByIdAndUpdate(
        previouslyProcessedTicketByWindow.id,
        { $set: { processDurationMS, closedAt: new Date().toISOString() } }
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
