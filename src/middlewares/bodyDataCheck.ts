import { Response, Request, NextFunction } from "express";

export default function (req: Request, res: Response, next: NextFunction) {
  try {
    const { windowNumber } = req.body;

    if (!windowNumber || typeof windowNumber !== "number") {
      throw new Error("window number is invalid");
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(401).send("Unauthorized to perform this operation.");
  }
}
