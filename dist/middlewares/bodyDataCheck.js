export default function (req, res, next) {
    try {
        const { windowNumber, stop } = req.body;
        if (!windowNumber || typeof windowNumber !== "number") {
            throw new Error("window number is invalid");
        }
        if (stop && typeof stop !== "boolean") {
            throw new Error("stop value should be a boolean");
        }
        next();
    }
    catch (err) {
        res.status(401);
        next(err);
    }
}
//# sourceMappingURL=bodyDataCheck.js.map