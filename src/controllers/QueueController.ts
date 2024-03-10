import { Response, Request } from "express";
import { redisClient } from "../bin/www.js";

async function getQueueStatus(req: Request, res: Response) {
  const windowsKeys = await redisClient.keys("window:*");
  const windowsStatePromises = windowsKeys.map((w) => redisClient.get(w));
  const windowsState = await Promise.all(windowsStatePromises);
  const windowsStateHTML = windowsKeys
    .map((e) => e.split(":")[1])
    .sort((a, b) => Number(a) - Number(b))
    .map(
      (e, index) => `<br> window ${e} is treating ticket ${windowsState[index]}`
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
}

async function requestNewTicket(req: Request, res: Response) {
  const currentTotalQueueNumber = await redisClient.get("totalInQueue");
  const nextQueueNumber = Number(currentTotalQueueNumber || 0) + 1;
  await redisClient.set("totalInQueue", nextQueueNumber);

  res.status(200);
  res.send(
    `Added a ticket to queue. Current queue number is ${nextQueueNumber}`
  );
}

async function processNextTicket(req: Request, res: Response) {
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

  res.status(200);
  res.send(
    `successfuly Assigned ticket ${nextInQueue} to window ${windowNumber}`
  );
}

async function resetQueue(req: Request, res: Response) {
  await redisClient.flushAll();

  res.status(200);
  res.send("Queue was reset to 0");
}

export { getQueueStatus, requestNewTicket, processNextTicket, resetQueue };
