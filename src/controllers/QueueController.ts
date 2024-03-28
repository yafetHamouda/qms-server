import { Response, Request } from "express";
import { redisClient } from "../bin/www.js";
import TicketRequest from "../models/TicketRequest.js";
import TicketProcess from "../models/TicketProcess.js";
import { generateQueueStatus, getAllRedisStore } from "../utils/QueueHelper.js";

async function getQueueStatus(req: Request, res: Response) {
  try {
    const queueState = await generateQueueStatus();
    const windowsStateHTML = queueState.map(
      (e) => `<br> window ${e.window} is treating ticket ${e.ticket}`
    );
    const { currentInQueue, totalInQueue } = await getAllRedisStore();

    res.status(200);
    res.send(
      `Number of total tickets in queue is ${totalInQueue} <br> Current treating ticket in queue ${currentInQueue} <br>
        ${windowsStateHTML}`
    );
  } catch (error) {
    res.status(500);
    res.send(error);
  }
}

async function requestNewTicket(req: Request, res: Response) {
  try {
    // Redis queue checks and logic
    const { currentInQueue, totalInQueue } = await getAllRedisStore();
    const nextQueueNumber = totalInQueue + 1;
    await redisClient.set("totalInQueue", nextQueueNumber);

    const promisesResponse = await Promise.all([
      generateQueueStatus(),
      redisClient.set("totalInQueue", nextQueueNumber),
    ]);

    const [queueState] = promisesResponse;

    // SAVE TO DB
    const ticketRequest = new TicketRequest({
      ticketNumber: nextQueueNumber,
      clientName: "john doe",
      TicketNumberCurrentlyProcessed: currentInQueue,
      currentQueueState: queueState,
    });
    await ticketRequest.save();

    // Send back response to client
    res.status(200);
    res.send(
      `Added a ticket to queue. Current queue number is ${nextQueueNumber}`
    );
  } catch (error) {
    res.status(400);
    res.send(error);
  }
}

async function processNextTicket(req: Request, res: Response) {
  try {
    const { windowNumber } = req.body;

    if (!windowNumber || typeof windowNumber !== "number") {
      throw new Error("window number is invalid");
    }

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
        { $set: { processDurationMS } }
      );
    }

    // Redis queue checks and logic
    const { currentInQueue, totalInQueue } = await getAllRedisStore();
    const nextInQueue = currentInQueue + 1;
    if (nextInQueue > totalInQueue) {
      res.send("No available tickets in queue.");
      return;
    }

    await Promise.all([
      redisClient.set(`window:${windowNumber}`, nextInQueue),
      redisClient.set("currentInQueue", nextInQueue),
    ]);

    // Save to DB
    const queueState = await generateQueueStatus();
    const ticketProcess = new TicketProcess({
      TicketNumberToProccess: nextInQueue,
      windowToProcess: windowNumber,
      currentQueueState: queueState,
    });
    await ticketProcess.save();

    // Send back response to client
    res.status(200);
    res.send(
      `successfuly Assigned ticket ${nextInQueue} to window ${windowNumber}`
    );
  } catch (error) {
    res.status(400);
    res.send(error);
  }
}

async function resetQueue(req: Request, res: Response) {
  try {
    await redisClient.flushAll();

    // Send back response to client
    res.status(200);
    res.send("Queue was reset to 0");
  } catch (error) {
    res.status(500);
    res.send(error);
  }
}

export { getQueueStatus, requestNewTicket, processNextTicket, resetQueue };
