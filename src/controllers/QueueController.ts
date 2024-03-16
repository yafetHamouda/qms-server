import { Response, Request } from "express";
import { redisClient } from "../bin/www.js";
import TicketRequest from "../models/TicketRequest.js";
import TicketProcess from "../models/TicketProcess.js";
import { generateQueueStatus } from "../utils/QueueHelper.js";

async function getQueueStatus(req: Request, res: Response) {
  try {
    const queueState = await generateQueueStatus();
    const windowsStateHTML = queueState.map(
      (e) => `<br> window ${e.window} is treating ticket ${e.ticket}`
    );

    const totalInQueue = await redisClient.get("totalInQueue");
    const currentInQueue = await redisClient.get("currentInQueue");

    res.status(200);
    res.send(
      `Number of total tickets in queue is ${
        totalInQueue || 0
      } <br> Current treating ticket in queue ${currentInQueue || 0} <br>
        ${windowsStateHTML}`
    );
  } catch (error) {
    res.status(500);
    res.send(error);
  }
}

async function requestNewTicket(req: Request, res: Response) {
  try {
    const currentTotalQueueNumber = await redisClient.get("totalInQueue");
    const nextQueueNumber = Number(currentTotalQueueNumber || 0) + 1;
    await redisClient.set("totalInQueue", nextQueueNumber);
    const currentInQueue = Number(await redisClient.get("currentInQueue")) || 0;

    const queueState = await generateQueueStatus();

    // SAVE TO DB
    const ticketRequest = new TicketRequest({
      ticketNumber: nextQueueNumber,
      clientName: "john doe",
      TicketNumberCurrentlyProcessed: currentInQueue,
      currentQueueState: queueState,
    });
    await ticketRequest.save();

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
    const { windowNumber } = res.locals;

    const totalInQueue = Number(await redisClient.get("totalInQueue")) || 0;
    const currentInQueue = Number(await redisClient.get("currentInQueue")) || 0;
    const nextInQueue = currentInQueue + 1;

    if (nextInQueue > totalInQueue) {
      res.send("No available tickets in queue.");
      return;
    }

    await redisClient.set(`window:${windowNumber}`, nextInQueue);
    await redisClient.set("currentInQueue", nextInQueue);

    const queueState = await generateQueueStatus();

    // SAVE TO DB
    const ticketProcess = new TicketProcess({
      TicketNumberToProccess: nextInQueue,
      windowToProcess: windowNumber,
      currentQueueState: queueState,
    });
    await ticketProcess.save();

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

    res.status(200);
    res.send("Queue was reset to 0");
  } catch (error) {
    res.status(500);
    res.send(error);
  }
}

export { getQueueStatus, requestNewTicket, processNextTicket, resetQueue };
