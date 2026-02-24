"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingService = exports.RatingServiceError = void 0;
const rating_model_1 = __importDefault(require("../models/rating.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
class RatingServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "RatingServiceError";
        this.statusCode = statusCode;
    }
}
exports.RatingServiceError = RatingServiceError;
const parseSort = (sort) => {
    if (!sort)
        return { createdAt: -1 };
    const [field, direction = "desc"] = sort.split(":");
    const allowedFields = new Set(["createdAt", "updatedAt", "rating"]);
    if (!allowedFields.has(field))
        return { createdAt: -1 };
    return { [field]: direction.toLowerCase() === "asc" ? 1 : -1 };
};
const ensureUserExists = async (userId) => {
    const userExists = await user_model_1.default.exists({ _id: userId });
    if (!userExists)
        throw new RatingServiceError("User not found", 404);
};
const ensureProductExists = async (productId) => {
    const productExists = await product_model_1.default.exists({ _id: productId });
    if (!productExists)
        throw new RatingServiceError("Product not found", 404);
};
exports.RatingService = {
    async listRatings(query) {
        const { page, limit, sort, userId, productId } = query;
        const skip = (page - 1) * limit;
        const filter = {};
        if (userId)
            filter.userId = userId;
        if (productId)
            filter.productId = productId;
        const [ratings, total] = await Promise.all([
            rating_model_1.default.find(filter).sort(parseSort(sort)).skip(skip).limit(limit),
            rating_model_1.default.countDocuments(filter),
        ]);
        return {
            ratings,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        };
    },
    async getRatingById(ratingId) {
        return rating_model_1.default.findById(ratingId);
    },
    async createRating(payload) {
        await ensureUserExists(payload.userId);
        await ensureProductExists(payload.productId);
        return rating_model_1.default.create(payload);
    },
    async replaceRating(ratingId, payload) {
        await ensureUserExists(payload.userId);
        await ensureProductExists(payload.productId);
        return rating_model_1.default.findByIdAndUpdate(ratingId, payload, {
            new: true,
            runValidators: true,
            overwrite: true,
        });
    },
    async updateRating(ratingId, payload) {
        return rating_model_1.default.findByIdAndUpdate(ratingId, payload, {
            new: true,
            runValidators: true,
        });
    },
    async deleteRating(ratingId) {
        return rating_model_1.default.findByIdAndDelete(ratingId);
    },
};
