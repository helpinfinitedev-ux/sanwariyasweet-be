"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCart = exports.updateCart = exports.replaceCart = exports.createCart = exports.getCartById = exports.listCarts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const cart_service_1 = require("../services/cart.service");
const errorResponse = (res, statusCode, message) => res.status(statusCode).json({ message, result: {} });
const allowedPayloadFields = new Set(["userId", "items"]);
const allowedItemFields = new Set(["productId", "quantity", "price", "unit"]);
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
    if (!isNonEmptyString(body.userId))
        return null;
    if (!validateObjectId(body.userId.trim()))
        return null;
    const items = parseItems(body.items);
    if (!items)
        return null;
    return {
        userId: body.userId.trim(),
        items,
    };
};
const buildPatchPayload = (body) => {
    if (!hasOnlyAllowedFields(body, new Set(["items"])))
        return null;
    const payload = {};
    if ("items" in body) {
        const items = parseItems(body.items);
        if (!items)
            return null;
        payload.items = items;
    }
    if (Object.keys(payload).length === 0)
        return null;
    return payload;
};
const mapServiceError = (res, error) => {
    if (error instanceof cart_service_1.CartServiceError)
        return errorResponse(res, error.statusCode, error.message);
    if (error instanceof mongoose_1.default.Error.ValidationError)
        return errorResponse(res, 400, error.message);
    console.error("Cart controller error:", error);
    return errorResponse(res, 500, "Internal server error");
};
const listCarts = async (req, res) => {
    try {
        const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
        const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
        const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
        const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
        if (userId && !validateObjectId(userId))
            return errorResponse(res, 400, "Invalid user id");
        const result = await cart_service_1.CartService.listCarts({ page, limit, sort, userId });
        return res.status(200).json({ message: "Carts fetched successfully", result });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.listCarts = listCarts;
const getCartById = async (req, res) => {
    try {
        const cartId = getRouteParam(req.params.cartId);
        if (!cartId || !validateObjectId(cartId))
            return errorResponse(res, 400, "Invalid cart id");
        const cart = await cart_service_1.CartService.getCartById(cartId);
        if (!cart)
            return errorResponse(res, 404, "Cart not found");
        return res.status(200).json({ message: "Cart fetched successfully", result: { cart } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.getCartById = getCartById;
const createCart = async (req, res) => {
    try {
        const payload = buildCreatePayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body. Required fields: userId, items");
        }
        const cart = await cart_service_1.CartService.createCart(payload);
        return res.status(201).json({ message: "Cart created successfully", result: { cart } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.createCart = createCart;
const replaceCart = async (req, res) => {
    try {
        const cartId = getRouteParam(req.params.cartId);
        if (!cartId || !validateObjectId(cartId))
            return errorResponse(res, 400, "Invalid cart id");
        const payload = buildCreatePayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body. Required fields: userId, items");
        }
        const cart = await cart_service_1.CartService.replaceCart(cartId, payload);
        if (!cart)
            return errorResponse(res, 404, "Cart not found");
        return res.status(200).json({ message: "Cart replaced successfully", result: { cart } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.replaceCart = replaceCart;
const updateCart = async (req, res) => {
    try {
        const cartId = getRouteParam(req.params.cartId);
        if (!cartId || !validateObjectId(cartId))
            return errorResponse(res, 400, "Invalid cart id");
        const payload = buildPatchPayload(req.body);
        if (!payload)
            return errorResponse(res, 400, "Invalid request body for update");
        const cart = await cart_service_1.CartService.updateCart(cartId, payload);
        if (!cart)
            return errorResponse(res, 404, "Cart not found");
        return res.status(200).json({ message: "Cart updated successfully", result: { cart } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.updateCart = updateCart;
const deleteCart = async (req, res) => {
    try {
        const cartId = getRouteParam(req.params.cartId);
        if (!cartId || !validateObjectId(cartId))
            return errorResponse(res, 400, "Invalid cart id");
        const cart = await cart_service_1.CartService.deleteCart(cartId);
        if (!cart)
            return errorResponse(res, 404, "Cart not found");
        return res.status(200).json({ message: "Cart deleted successfully", result: { cart } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.deleteCart = deleteCart;
