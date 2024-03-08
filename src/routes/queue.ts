import { Router } from "express";
import { redisClient } from "../bin/www.js";
const router = Router();

/* GET next ticket to process */
router.get("/", async function (req, res) {
  const { deviceId } = req.body;
  if (
    !deviceId ||
    typeof deviceId !== "number" ||
    ![1, 2, 3].includes(deviceId)
  ) {
    throw new Error("device is invalid");
  }

  const totalInQueue = Number(await redisClient.get("totalInQueue")) || 0;
  const currentInQueue = Number(await redisClient.get("currentInQueue")) || 0;
  const nextInQueue = currentInQueue + 1;

  if (nextInQueue > totalInQueue) {
    res.send("No available tickets in queue.");
    return;
  }

  let assignedWindow = null;
  if (deviceId === 1) {
    assignedWindow = "first window";
    await redisClient.set("firstWindow", nextInQueue);
  } else if (deviceId === 2) {
    assignedWindow = "second window";
    await redisClient.set("secondWindow", nextInQueue);
  } else if (deviceId === 3) {
    assignedWindow = "third window";
    await redisClient.set("thirdWindow", nextInQueue);
  }
  await redisClient.set("currentInQueue", nextInQueue);
  res.send(`successfuly Assigned ticket to ${assignedWindow}`);
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
  await redisClient.set("totalInQueue", 0);
  await redisClient.set("firstWindow", 0);
  await redisClient.set("secondWindow", 0);
  await redisClient.set("thirdWindow", 0);

  res.send("Queue was reset to 0");
});

export default router;
