import { Router } from "express";
import { redisClient } from "../bin/www.js";

const router = Router();

/* GET queue state. */
router.get("/", async function (req, res) {
  const windowsKeys = await redisClient.keys("window:*");
  const windowsStatePromises = windowsKeys.map((w) => redisClient.get(w));
  const windowsState = await Promise.all(windowsStatePromises);
  const windowsStateHTML = windowsKeys.map(
    (e, index) =>
      `<br> ${e.replace(":", " ")} is treating ticket ${windowsState[index]}`
  );

  const totalInQueue = await redisClient.get("totalInQueue");
  const currentInQueue = await redisClient.get("currentInQueue");

  res.send(
    `Number of total tickets in queue is ${
      totalInQueue || 0
    } <br> Current treating ticket in queue ${currentInQueue || 0} <br>
    ${windowsStateHTML}`
  );
});

export default router;
