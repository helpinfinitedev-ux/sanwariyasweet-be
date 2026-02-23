"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrder = exports.updateOrder = exports.replaceOrder = exports.createOrder = exports.getOrderById = exports.listOrders = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const order_service_1 = require("../services/order.service");
const errorResponse = (res, statusCode, message) => res.status(statusCode).json({ message, result: {} });
const allowedPayloadFields = new Set([
    "userId",
    "items",
    "address",
    "phoneNumber",
    "expectedDeliveryDate",
    "status",
]);
const allowedPatchPayloadFields = new Set([
    "items",
    "address",
    "phoneNumber",
    "expectedDeliveryDate",
    "status",
]);
const allowedItemFields = new Set(["productId", "quantity", "price", "unit"]);
const allowedStatus = new Set(["pending", "shipped", "in-transit", "delivered"]);
const allowedUnits = new Set(["kg", "g", "pcs"]);
const hasOnlyAllowedFields = (body, allowed) => Object.keys(body).every((key) => allowed.has(key));
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
const validateObjectId = (value) => mongoose_1.default.Types.ObjectId.isValid(value);
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const toPositiveNumber = (value) => {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0)
        return null;
    return parsed;
};
const toNonNegativeNumber = (value) => {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0)
        return null;
    return parsed;
};
const toDate = (value) => {
    if (!isNonEmptyString(value))
        return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return null;
    return date;
};
const getRouteParam = (value) => {
    if (typeof value === "string")
        return value;
    if (Array.isArray(value) && value.length > 0)
        return value[0];
    return null;
};
const parseItems = (itemsValue) => {
    if (!Array.isArray(itemsValue) || itemsValue.length === 0)
        return null;
    const parsedItems = itemsValue.map((item) => {
        if (!item || typeof item !== "object")
            return null;
        const record = item;
        if (!hasOnlyAllowedFields(record, allowedItemFields))
            return null;
        if (!isNonEmptyString(record.productId))
            return null;
        if (!validateObjectId(record.productId.trim()))
            return null;
        const quantity = toPositiveNumber(record.quantity);
        const price = toNonNegativeNumber(record.price);
        if (quantity === null || price === null)
            return null;
        if (typeof record.unit !== "string" || !allowedUnits.has(record.unit))
            return null;
        return {
            productId: record.productId.trim(),
            quantity,
            price,
            unit: record.unit,
        };
    });
    if (parsedItems.some((item) => item === null))
        return null;
    return parsedItems;
};
const buildCreatePayload = (body) => {
    if (!hasOnlyAllowedFields(body, allowedPayloadFields))
        return null;
    if (!isNonEmptyString(body.userId) || !validateObjectId(body.userId.trim()))
        return null;
    if (!isNonEmptyString(body.address))
        return null;
    if (!isNonEmptyString(body.phoneNumber))
        return null;
    const items = parseItems(body.items);
    const expectedDeliveryDate = toDate(body.expectedDeliveryDate);
    if (!items || !expectedDeliveryDate)
        return null;
    if ("status" in body) {
        if (typeof body.status !== "string" || !allowedStatus.has(body.status))
            return null;
    }
    return {
        userId: body.userId.trim(),
        items,
        address: body.address.trim(),
        phoneNumber: body.phoneNumber.trim(),
        expectedDeliveryDate,
        status: typeof body.status === "string" ? body.status : undefined,
    };
};
const buildPatchPayload = (body) => {
    if (!hasOnlyAllowedFields(body, allowedPatchPayloadFields))
        return null;
    const payload = {};
    if ("items" in body) {
        const items = parseItems(body.items);
        if (!items)
            return null;
        payload.items = items;
    }
    if ("address" in body) {
        if (!isNonEmptyString(body.address))
            return null;
        payload.address = body.address.trim();
    }
    if ("phoneNumber" in body) {
        if (!isNonEmptyString(body.phoneNumber))
            return null;
        payload.phoneNumber = body.phoneNumber.trim();
    }
    if ("expectedDeliveryDate" in body) {
        const expectedDeliveryDate = toDate(body.expectedDeliveryDate);
        if (!expectedDeliveryDate)
            return null;
        payload.expectedDeliveryDate = expectedDeliveryDate;
    }
    if ("status" in body) {
        if (typeof body.status !== "string" || !allowedStatus.has(body.status))
            return null;
        payload.status = body.status;
    }
    if (Object.keys(payload).length === 0)
        return null;
    return payload;
};
const mapServiceError = (res, error) => {
    if (error instanceof order_service_1.OrderServiceError)
        return errorResponse(res, error.statusCode, error.message);
    if (error instanceof mongoose_1.default.Error.ValidationError)
        return errorResponse(res, 400, error.message);
    console.error("Order controller error:", error);
    return errorResponse(res, 500, "Internal server error");
};
const listOrders = async (req, res) => {
    try {
        const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
        const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
        const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
        const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        if (userId && !validateObjectId(userId))
            return errorResponse(res, 400, "Invalid user id");
        if (status && !allowedStatus.has(status))
            return errorResponse(res, 400, "Invalid status");
        const result = await order_service_1.OrderService.listOrders({
            page,
            limit,
            sort,
            userId,
            status: status,
        });
        return res.status(200).json({ message: "Orders fetched successfully", result });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.listOrders = listOrders;
const getOrderById = async (req, res) => {
    try {
        const orderId = getRouteParam(req.params.orderId);
        if (!orderId || !validateObjectId(orderId))
            return errorResponse(res, 400, "Invalid order id");
        const order = await order_service_1.OrderService.getOrderById(orderId);
        if (!order)
            return errorResponse(res, 404, "Order not found");
        return res.status(200).json({ message: "Order fetched successfully", result: { order } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.getOrderById = getOrderById;
const createOrder = async (req, res) => {
    try {
        const payload = buildCreatePayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body. Required fields: userId, items, address, phoneNumber, expectedDeliveryDate");
        }
        const order = await order_service_1.OrderService.createOrder(payload);
        return res.status(201).json({ message: "Order created successfully", result: { order } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.createOrder = createOrder;
const replaceOrder = async (req, res) => {
    try {
        const orderId = getRouteParam(req.params.orderId);
        if (!orderId || !validateObjectId(orderId))
            return errorResponse(res, 400, "Invalid order id");
        const payload = buildCreatePayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body. Required fields: userId, items, address, phoneNumber, expectedDeliveryDate");
        }
        const order = await order_service_1.OrderService.replaceOrder(orderId, payload);
        if (!order)
            return errorResponse(res, 404, "Order not found");
        return res.status(200).json({ message: "Order replaced successfully", result: { order } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.replaceOrder = replaceOrder;
const updateOrder = async (req, res) => {
    try {
        const orderId = getRouteParam(req.params.orderId);
        if (!orderId || !validateObjectId(orderId))
            return errorResponse(res, 400, "Invalid order id");
        const payload = buildPatchPayload(req.body);
        if (!payload)
            return errorResponse(res, 400, "Invalid request body for update");
        const order = await order_service_1.OrderService.updateOrder(orderId, payload);
        if (!order)
            return errorResponse(res, 404, "Order not found");
        return res.status(200).json({ message: "Order updated successfully", result: { order } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.updateOrder = updateOrder;
const deleteOrder = async (req, res) => {
    try {
        const orderId = getRouteParam(req.params.orderId);
        if (!orderId || !validateObjectId(orderId))
            return errorResponse(res, 400, "Invalid order id");
        const order = await order_service_1.OrderService.deleteOrder(orderId);
        if (!order)
            return errorResponse(res, 404, "Order not found");
        return res.status(200).json({ message: "Order deleted successfully", result: { order } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.deleteOrder = deleteOrder;
