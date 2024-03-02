import { Router } from "express";
import { redisClient } from "../bin/www.js";
const router = Router();

/* GET queue status. */
router.get("/", async function (req, res) {
  const totalInQueue = await redisClient.get("totalInQueue");

  res.send(`Number of total tickets in queue is ${totalInQueue || 0}`);
});

/* Post a new ticket to queue. */
router.post("/", async function (req, res) {
  const currentQueueNumber = await redisClient.get("totalInQueue");
  const nextQueueNumber = Number(currentQueueNumber || 0) + 1;
  await redisClient.set("totalInQueue", nextQueueNumber);

  res.send(
    `Added a ticket to queue. Current queue number is ${nextQueueNumber}`
  );
});

/* Reset queue to 0 */
router.delete("/", async function (req, res) {
  await redisClient.set("totalInQueue", 0);

  res.send("Queue was reset to 0");
});

export default router;
