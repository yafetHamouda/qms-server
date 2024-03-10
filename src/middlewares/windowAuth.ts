import { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";

export default function (req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(
      token!,
      process.env.SECRET_JWT_KEY!
    ) as jwt.JwtPayload;
    const { establishmentId, windowNumber } = decoded;

    if (process.env.ESTABLISHMENT_ID !== establishmentId) {
      throw Error("Establishment is invalid.");
    }

    if (!windowNumber || typeof windowNumber !== "number") {
      throw new Error("window number is invalid");
    }

    res.locals.establishmentId = establishmentId;
    res.locals.windowNumber = windowNumber;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).send("Unauthorized to perform this operation.");
  }
}
