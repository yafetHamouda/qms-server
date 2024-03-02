import { Router } from "express";
const router = Router();
/* GET tickets listing. */
router.get("/", function (req, res, next) {
    res.send("respond with tickets resources");
});
/* Post a new ticket to queue. */
router.post("/", function (req, res, next) {
    res.send("Added ticket to queue");
});
export default router;
//# sourceMappingURL=tickets.js.map