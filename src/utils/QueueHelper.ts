import { redisClient } from "../bin/www.js";

const generateQueueStatus = async () => {
  const windowsKeys = await redisClient.keys("window:*");
  const windowsState = await Promise.all(
    windowsKeys.map((w) => redisClient.get(w))
  );

  const queueState = windowsKeys
    .map((e) => e.split(":")[1])
    .map((e, index) => {
      return {
        window: Number(e),
        ticket: Number(windowsState[index]),
      };
    })
    .sort((a, b) => a.window - b.window);

  return queueState;
};

export { generateQueueStatus };
