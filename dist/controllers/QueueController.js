var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { redisClient, io } from "../bin/www.js";
import Ticket from "../models/Ticket.js";
import { generateQueueStatus, getAllRedisStore } from "../utils/QueueHelper.js";
function getQueueStatus(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { format } = req.query;
            const queueState = yield generateQueueStatus();
            const { currentInQueue, totalInQueue } = yield getAllRedisStore();
            const windowsStateHTML = queueState.map((e) => `<br> window ${e.window} is treating ticket ${e.ticket}`);
            res.status(200);
            if (format === "json") {
                res.send({
                    queueState,
                    currentInQueue,
                    totalInQueue,
                });
            }
            else {
                res.send(`Number of total tickets in queue is ${totalInQueue} <br> Current treating ticket in queue ${currentInQueue} <br>
        ${windowsStateHTML}`);
            }
        }
        catch (error) {
            next(error);
        }
    });
}
function requestNewTicket(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Redis queue checks and logic
            const { currentInQueue, totalInQueue } = yield getAllRedisStore();
            const queueState = yield generateQueueStatus();
            const nextQueueNumber = totalInQueue + 1;
            // SAVE TO DB
            const ticket = new Ticket({
                // processed field value is set as false by default as per the Ticket schema definition
                ticketNumber: nextQueueNumber,
                TicketNumberProcessedWhenOpened: currentInQueue,
                QueueStateWhenOpened: queueState,
            });
            const [postTicketRequest] = yield Promise.all([
                ticket.save(),
                redisClient.set("totalInQueue", nextQueueNumber),
            ]);
            const { EtaMS, EtaTime } = postTicketRequest;
            io.emit("queueUpdated", {
                totalInQueue: nextQueueNumber,
                currentInQueue,
                queueState,
            });
            // Send back response to client
            res.status(200);
            res.send({
                message: `Added a ticket to queue. Current queue number is ${nextQueueNumber}`,
                data: {
                    nextQueueNumber,
                    EtaMS: EtaMS || undefined,
                    EtaTime: EtaTime || undefined,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function processNextTicket(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { windowNumber, stop } = req.body;
            if (stop === true) {
                return res.send({ message: "You stopped processing tickets" });
            }
            // Redis queue checks and logic
            const { currentInQueue, totalInQueue } = yield getAllRedisStore();
            const nextInQueue = currentInQueue + 1;
            if (nextInQueue > totalInQueue) {
                return res.send({ message: "No available tickets in queue." });
            }
            yield Promise.all([
                redisClient.set(`window:${windowNumber}`, nextInQueue),
                redisClient.set("currentInQueue", nextInQueue),
            ]);
            // Save to DB
            const queueState = yield generateQueueStatus();
            const update = {
                QueueStateWhenStartedProcessing: queueState,
                processedByWindow: windowNumber,
            };
            yield Ticket.findOneAndUpdate({
                ticketNumber: nextInQueue,
                processed: false,
            }, update, { sort: { _id: -1 } }).exec();
            io.emit("queueUpdated", {
                totalInQueue,
                currentInQueue: nextInQueue,
                queueState,
            });
            // Send back response to client
            res.status(200);
            res.send({
                message: `successfuly Assigned ticket ${nextInQueue} to window ${windowNumber}`,
                currentInQueue: nextInQueue,
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function exitQueue(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { windowNumber } = req.body;
            yield redisClient.del(`window:${windowNumber}`);
            const promises = yield Promise.all([
                getAllRedisStore(),
                generateQueueStatus(),
            ]);
            const [{ currentInQueue, totalInQueue }, queueState] = promises;
            io.emit("queueUpdated", {
                totalInQueue,
                currentInQueue,
                queueState,
            });
            res.status(200).send({});
        }
        catch (error) {
            next(error);
        }
    });
}
function resetQueue(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield redisClient.flushAll();
            // Send back response to client
            res.status(200);
            res.send("Queue was reset to 0");
        }
        catch (error) {
            next(error);
        }
    });
}
export { getQueueStatus, requestNewTicket, processNextTicket, resetQueue, exitQueue, };
//# sourceMappingURL=QueueController.js.map