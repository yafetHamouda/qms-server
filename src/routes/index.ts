import { Router } from "express";
import { redisClient } from "../bin/www.js";

const router = Router();

/* GET home page. */
router.get("/", async function (req, res) {
  const totalInQueue = await redisClient.get("totalInQueue");
  const currentInQueue = Number(await redisClient.get("currentInQueue")) || 0;
  const firstWindow = await redisClient.get("firstWindow");
  const secondWindow = await redisClient.get("secondWindow");
  const thirdWindow = await redisClient.get("thirdWindow");

  res.send(
    `Number of total tickets in queue is ${
      totalInQueue || 0
    } <br> Current treating ticket in queue ${currentInQueue || 0} 
      <br> First window is treating ticket ${firstWindow || 0} 
      <br> Second window is treating ticket ${secondWindow || 0} 
      <br> Third window is treating ticket ${thirdWindow || 0}`
  );
});

export default router;
