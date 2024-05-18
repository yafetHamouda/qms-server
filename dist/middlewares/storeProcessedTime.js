var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Ticket from "../models/Ticket.js";
const FORTY_FIVE_MINUTES_MS = 2700000;
export default function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { windowNumber } = req.body;
            // insert process duration for last ticket processed by the window making request
            const previouslyProcessedTicketByWindow = yield Ticket.findOne({
                processedByWindow: windowNumber,
            }, null, { sort: { _id: -1 } }).exec();
            if (previouslyProcessedTicketByWindow &&
                !previouslyProcessedTicketByWindow.processed) {
                yield Ticket.findByIdAndUpdate(previouslyProcessedTicketByWindow.id, {
                    $set: {
                        processed: true,
                    },
                });
                const processDurationMS = new Date().getTime() -
                    previouslyProcessedTicketByWindow.createdAt.getTime();
                // if a ticket process duration exceeds 45 minutes, for now, we consider that as polluted data so it does not affect the avg
                // calculation time
                if (processDurationMS > FORTY_FIVE_MINUTES_MS) {
                    return next();
                }
                yield Ticket.findByIdAndUpdate(previouslyProcessedTicketByWindow.id, {
                    $set: {
                        processDurationMS,
                        closedAt: new Date().toISOString(),
                    },
                });
            }
            next();
        }
        catch (err) {
            next(err);
        }
    });
}
//# sourceMappingURL=storeProcessedTime.js.map