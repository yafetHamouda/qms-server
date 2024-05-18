import jwt from "jsonwebtoken";
export default function (req, res, next) {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        const decoded = jwt.verify(token, process.env.SECRET_JWT_KEY);
        const { establishmentId } = decoded;
        if (process.env.ESTABLISHMENT_ID !== establishmentId) {
            throw Error("Establishment is invalid.");
        }
        res.locals.establishmentId = establishmentId;
        next();
    }
    catch (err) {
        console.error(err);
        res.status(401).send("Unauthorized to perform this operation.");
    }
}
//# sourceMappingURL=windowAuth.js.map