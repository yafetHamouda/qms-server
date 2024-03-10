import { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";

export default function (req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(
      token!,
      "e54ccced-d125-4843-b0e4-56995a285a9f"
    ) as jwt.JwtPayload;
    const { establishmentId, windowNumber } = decoded;
    //TODO: add establishmentId check here
    res.locals.establishmentId = establishmentId;
    res.locals.windowNumber = windowNumber;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).send("Unauthorized to perform this operation.");
  }
}
