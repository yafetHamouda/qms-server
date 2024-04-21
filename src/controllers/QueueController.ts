import { Response, Request, NextFunction } from "express";
import { redisClient, io } from "../bin/www.js";
import Ticket from "../models/Ticket.js";
import { generateQueueStatus, getAllRedisStore } from "../utils/QueueHelper.js";
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
    // Redis queue checks and logic
    const { currentInQueue, totalInQueue } = await getAllRedisStore();
    const queueState = await generateQueueStatus();
    const nextQueueNumber = totalInQueue + 1;

    // SAVE TO DB
    const ticket = new Ticket({
      // processed field value is set as false by default as per the Ticket schema definition
      ticketNumber: nextQueueNumber,
      TicketNumberProcessedWhenOpened: currentInQueue,
      QueueStateWhenOpened: queueState,
    });

    const [postTicketRequest] = await Promise.all([
      ticket.save(),
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

    if (stop === true) {
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
    const update = {
      QueueStateWhenStartedProcessing: queueState,
      processedByWindow: windowNumber,
    };
    await Ticket.findOneAndUpdate(
      {
        ticketNumber: nextInQueue,
        processed: false,
      },
      update,
      { sort: { _id: -1 } }
    ).exec();

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

async function exitQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const { windowNumber } = req.body;

    await redisClient.del(`window:${windowNumber}`);
    const promises = await Promise.all([
      getAllRedisStore(),
      generateQueueStatus(),
    ]);

    const [{ currentInQueue, totalInQueue }, queueState] = promises;

    io.emit("queueUpdated", {
      totalInQueue,
      currentInQueue,
      queueState,
    });

    res.status(200).send({});
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

export {
  getQueueStatus,
  requestNewTicket,
  processNextTicket,
  resetQueue,
  exitQueue,
};
