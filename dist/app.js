var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dotenv from "dotenv";
import createError from "http-errors";
import express, { json, urlencoded, static as st, } from "express";
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
cron.schedule("0 0 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    yield redisClient.flushAll();
    console.log("successfully reset queue automatically at midnight");
}));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});
// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    // render the error page
    res.status(500);
    res.render("error");
});
export default app;
//TODO: add pm2 for server restaring when crashed
//# sourceMappingURL=app.js.map