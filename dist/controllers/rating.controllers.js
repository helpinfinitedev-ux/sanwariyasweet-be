"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRating = exports.updateRating = exports.replaceRating = exports.createRating = exports.getRatingById = exports.listRatings = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const rating_service_1 = require("../services/rating.service");
const errorResponse = (res, statusCode, message) => res.status(statusCode).json({ message, result: {} });
const createAllowedFields = new Set(["userId", "productId", "rating", "comment"]);
const patchAllowedFields = new Set(["rating", "comment"]);
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
const toRating = (value) => {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5)
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
const buildCreatePayload = (body) => {
    if (!hasOnlyAllowedFields(body, createAllowedFields))
        return null;
    if (!isNonEmptyString(body.userId) || !validateObjectId(body.userId.trim()))
        return null;
    if (!isNonEmptyString(body.productId) || !validateObjectId(body.productId.trim()))
        return null;
    const rating = toRating(body.rating);
    if (rating === null)
        return null;
    const payload = {
        userId: body.userId.trim(),
        productId: body.productId.trim(),
        rating,
    };
    if ("comment" in body) {
        if (typeof body.comment !== "string")
            return null;
        payload.comment = body.comment.trim();
    }
    return payload;
};
const buildPatchPayload = (body) => {
    if (!hasOnlyAllowedFields(body, patchAllowedFields))
        return null;
    const payload = {};
    if ("rating" in body) {
        const rating = toRating(body.rating);
        if (rating === null)
            return null;
        payload.rating = rating;
    }
    if ("comment" in body) {
        if (typeof body.comment !== "string")
            return null;
        payload.comment = body.comment.trim();
    }
    if (Object.keys(payload).length === 0)
        return null;
    return payload;
};
const mapServiceError = (res, error) => {
    if (error instanceof rating_service_1.RatingServiceError)
        return errorResponse(res, error.statusCode, error.message);
    if (error instanceof mongoose_1.default.Error.ValidationError)
        return errorResponse(res, 400, error.message);
    console.error("Rating controller error:", error);
    return errorResponse(res, 500, "Internal server error");
};
const listRatings = async (req, res) => {
    try {
        const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
        const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
        const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
        const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
        const productId = typeof req.query.productId === "string" ? req.query.productId : undefined;
        if (userId && !validateObjectId(userId))
            return errorResponse(res, 400, "Invalid user id");
        if (productId && !validateObjectId(productId)) {
            return errorResponse(res, 400, "Invalid product id");
        }
        const result = await rating_service_1.RatingService.listRatings({ page, limit, sort, userId, productId });
        return res.status(200).json({ message: "Ratings fetched successfully", result });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.listRatings = listRatings;
const getRatingById = async (req, res) => {
    try {
        const ratingId = getRouteParam(req.params.ratingId);
        if (!ratingId || !validateObjectId(ratingId))
            return errorResponse(res, 400, "Invalid rating id");
        const rating = await rating_service_1.RatingService.getRatingById(ratingId);
        if (!rating)
            return errorResponse(res, 404, "Rating not found");
        return res.status(200).json({ message: "Rating fetched successfully", result: { rating } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.getRatingById = getRatingById;
const createRating = async (req, res) => {
    try {
        const payload = buildCreatePayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body. Required fields: userId, productId, rating");
        }
        const rating = await rating_service_1.RatingService.createRating(payload);
        return res.status(201).json({ message: "Rating created successfully", result: { rating } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.createRating = createRating;
const replaceRating = async (req, res) => {
    try {
        const ratingId = getRouteParam(req.params.ratingId);
        if (!ratingId || !validateObjectId(ratingId))
            return errorResponse(res, 400, "Invalid rating id");
        const payload = buildCreatePayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body. Required fields: userId, productId, rating");
        }
        const rating = await rating_service_1.RatingService.replaceRating(ratingId, payload);
        if (!rating)
            return errorResponse(res, 404, "Rating not found");
        return res.status(200).json({ message: "Rating replaced successfully", result: { rating } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.replaceRating = replaceRating;
const updateRating = async (req, res) => {
    try {
        const ratingId = getRouteParam(req.params.ratingId);
        if (!ratingId || !validateObjectId(ratingId))
            return errorResponse(res, 400, "Invalid rating id");
        const payload = buildPatchPayload(req.body);
        if (!payload)
            return errorResponse(res, 400, "Invalid request body for update");
        const rating = await rating_service_1.RatingService.updateRating(ratingId, payload);
        if (!rating)
            return errorResponse(res, 404, "Rating not found");
        return res.status(200).json({ message: "Rating updated successfully", result: { rating } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.updateRating = updateRating;
const deleteRating = async (req, res) => {
    try {
        const ratingId = getRouteParam(req.params.ratingId);
        if (!ratingId || !validateObjectId(ratingId))
            return errorResponse(res, 400, "Invalid rating id");
        const rating = await rating_service_1.RatingService.deleteRating(ratingId);
        if (!rating)
            return errorResponse(res, 404, "Rating not found");
        return res.status(200).json({ message: "Rating deleted successfully", result: { rating } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.deleteRating = deleteRating;
