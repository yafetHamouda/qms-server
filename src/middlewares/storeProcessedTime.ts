import { Response, Request, NextFunction } from "express";
import TicketProcess from "../models/TicketProcess.js";

const FORTY_FIVE_MINUTES_MS = 2700000;

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

      // if a ticket process duration exceeds 45 minutes, for now, we consider that as polluted data so it does not affect the avg
      // calculation time
      if (processDurationMS > FORTY_FIVE_MINUTES_MS) {
        return next();
      }

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
