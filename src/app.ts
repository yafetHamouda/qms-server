import dotenv from "dotenv";
import createError from "http-errors";
import express, {
  json,
  urlencoded,
  static as st,
  Response,
  Request,
} from "express";
import { join } from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import indexRouter from "./routes/index.js";
import queueRouter from "./routes/queue.js";
import { redisClient } from "./bin/www.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// view engine setup
app.set("views", join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(st(join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/queue", queueRouter);

// chrone job to automatically reset at mid-night
cron.schedule("0 0 * * *", async () => {
  await redisClient.flushAll();
  console.log("successfully reset queue automatically at midnight");
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err: Error, req: Request, res: Response) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(500);
  res.render("error");
});

export default app;

//TODO: add pm2 for server restaring when crashed
// TODO: don't accept etaMs superior than 45 minutes
