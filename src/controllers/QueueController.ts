import { Response, Request, NextFunction } from "express";
import { redisClient, io } from "../bin/www.js";
import TicketRequest from "../models/TicketRequest.js";
import TicketProcess from "../models/TicketProcess.js";
import { generateQueueStatus, getAllRedisStore } from "../utils/QueueHelper.js";
import { checkPhoneNumber } from "../utils/checkNumber.js";
import {
  QueueStateResponse,
  RequestNewTicketResponse,
  ProcessNextTicketResponse,
} from "../utils/types.js";

async function getQueueStatus(
  req: Request,
  res: Response<QueueStateResponse | string>,
  next: NextFunction
) {
  try {
    const { format } = req.query;

    const queueState = await generateQueueStatus();
    const { currentInQueue, totalInQueue } = await getAllRedisStore();
    const windowsStateHTML = queueState.map(
      (e) => `<br> window ${e.window} is treating ticket ${e.ticket}`
    );

    res.status(200);
    if (format === "json") {
      res.send({
        queueState,
        currentInQueue,
        totalInQueue,
      });
    } else {
      res.send(
        `Number of total tickets in queue is ${totalInQueue} <br> Current treating ticket in queue ${currentInQueue} <br>
        ${windowsStateHTML}`
      );
    }
  } catch (error) {
    next(error);
  }
}

async function requestNewTicket(
  req: Request,
  res: Response<RequestNewTicketResponse>,
  next: NextFunction
) {
  try {
    const { phoneNumber } = req.body;

    if (
      !!phoneNumber &&
      (phoneNumber.length !== 8 || !checkPhoneNumber(phoneNumber))
    ) {
      res.status(400);
      throw Error("Phone number is invalid");
    }

    // Redis queue checks and logic
    const { currentInQueue, totalInQueue } = await getAllRedisStore();
    const queueState = await generateQueueStatus();
    const nextQueueNumber = totalInQueue + 1;

    // SAVE TO DB
    const ticketRequest = new TicketRequest({
      ticketNumber: nextQueueNumber,
      TicketNumberCurrentlyProcessed: currentInQueue,
      currentQueueState: queueState,
      clientPhoneNumber: phoneNumber,
    });

    const [postTicketRequest] = await Promise.all([
      ticketRequest.save(),
      redisClient.set("totalInQueue", nextQueueNumber),
    ]);

    const { EtaMS, EtaTime } = postTicketRequest;

    io.emit("queueUpdated", {
      totalInQueue: nextQueueNumber,
      currentInQueue,
      queueState,
    });

    // Send back response to client
    res.status(200);
    res.send({
      message: `Added a ticket to queue. Current queue number is ${nextQueueNumber}`,
      data: {
        nextQueueNumber,
        EtaMS: EtaMS || undefined,
        EtaTime: EtaTime || undefined,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function processNextTicket(
  req: Request,
  res: Response<ProcessNextTicketResponse | string>,
  next: NextFunction
) {
  try {
    const { windowNumber, stop } = req.body;

    if (stop) {
      return res.send({ message: "You stopped processing tickets" });
    }

    // Redis queue checks and logic
    const { currentInQueue, totalInQueue } = await getAllRedisStore();
    const nextInQueue = currentInQueue + 1;
    if (nextInQueue > totalInQueue) {
      return res.send({ message: "No available tickets in queue." });
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

    io.emit("queueUpdated", {
      totalInQueue,
      currentInQueue: nextInQueue,
      queueState,
    });

    // Send back response to client
    res.status(200);
    res.send({
      message: `successfuly Assigned ticket ${nextInQueue} to window ${windowNumber}`,
      currentInQueue: nextInQueue,
    });
  } catch (error) {
    next(error);
  }
}

async function resetQueue(req: Request, res: Response, next: NextFunction) {
  try {
    await redisClient.flushAll();

    // Send back response to client
    res.status(200);
    res.send("Queue was reset to 0");
  } catch (error) {
    next(error);
  }
}

export { getQueueStatus, requestNewTicket, processNextTicket, resetQueue };
