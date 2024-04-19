import { Response, Request, NextFunction } from "express";

export default function (req: Request, res: Response, next: NextFunction) {
  try {
    const { windowNumber, next: processNext } = req.body;

    if (!windowNumber || typeof windowNumber !== "number") {
      throw new Error("window number is invalid");
    }

    if (processNext && typeof processNext !== "boolean") {
      throw new Error("next value should be a boolean");
    }

    next();
  } catch (err) {
    res.status(401);
    next(err);
  }
}
