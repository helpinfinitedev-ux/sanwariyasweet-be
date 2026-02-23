"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListUsers = exports.adminListProducts = exports.adminListOrders = void 0;
const admin_service_1 = require("../services/admin.service");
const parsePaginationNumber = (value, fallback, min, max) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
        return fallback;
    const integer = Math.trunc(parsed);
    if (integer < min)
        return min;
    if (integer > max)
        return max;
    return integer;
};
const adminListOrders = async (req, res) => {
    try {
        const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
        const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
        const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
        const result = await admin_service_1.AdminService.listAllOrders({ page, limit, sort });
        return res.status(200).json({ message: "All orders fetched successfully", result });
    }
    catch (error) {
        console.error("Admin list orders error:", error);
        return res.status(500).json({ message: "Internal server error", result: {} });
    }
};
exports.adminListOrders = adminListOrders;
const adminListProducts = async (req, res) => {
    try {
        const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
        const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
        const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
        const result = await admin_service_1.AdminService.listAllProducts({ page, limit, sort });
        return res.status(200).json({ message: "All products fetched successfully", result });
    }
    catch (error) {
        console.error("Admin list products error:", error);
        return res.status(500).json({ message: "Internal server error", result: {} });
    }
};
exports.adminListProducts = adminListProducts;
const adminListUsers = async (req, res) => {
    try {
        const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
        const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
        const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
        const result = await admin_service_1.AdminService.listAllUsers({ page, limit, sort });
        return res.status(200).json({ message: "All users fetched successfully", result });
    }
    catch (error) {
        console.error("Admin list users error:", error);
        return res.status(500).json({ message: "Internal server error", result: {} });
    }
};
exports.adminListUsers = adminListUsers;
