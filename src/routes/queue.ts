import { Router } from "express";
import { redisClient } from "../bin/www.js";
import windowAuth from "../middlewares/windowAuth.js";
const router = Router();

/* GET next ticket in process */
router.get("/", windowAuth, async function (req, res) {
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
  res.send(
    `successfuly Assigned ticket ${nextInQueue} to window ${windowNumber}`
  );
});

/* append a new ticket to queue. */
router.post("/", async function (req, res) {
  const currentTotalQueueNumber = await redisClient.get("totalInQueue");
  const nextQueueNumber = Number(currentTotalQueueNumber || 0) + 1;
  await redisClient.set("totalInQueue", nextQueueNumber);

  res.send(
    `Added a ticket to queue. Current queue number is ${nextQueueNumber}`
  );
});

/* Reset queue to 0 */
router.delete("/", async function (req, res) {
  await redisClient.flushAll();
  res.send("Queue was reset to 0");
});

export default router;
