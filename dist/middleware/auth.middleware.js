"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuth = void 0;
const jwt_1 = require("../lib/jwt");
const unauthorized = (res, message) => res.status(401).json({ message, result: {} });
const forbidden = (res, message) => res.status(403).json({ message, result: {} });
const requireAuth = (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        if (!authorization || !authorization.startsWith("Bearer ")) {
            return unauthorized(res, "Unauthorized");
        }
        const token = authorization.slice(7).trim();
        if (!token)
            return unauthorized(res, "Unauthorized");
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        return next();
    }
    catch {
        return unauthorized(res, "Unauthorized");
    }
};
exports.requireAuth = requireAuth;
const requireAdmin = (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "admin") {
        return forbidden(res, "Admin access required");
    }
    return next();
};
exports.requireAdmin = requireAdmin;
