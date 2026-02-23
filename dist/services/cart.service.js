"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = exports.CartServiceError = void 0;
const cart_model_1 = __importDefault(require("../models/cart.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
class CartServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "CartServiceError";
        this.statusCode = statusCode;
    }
}
exports.CartServiceError = CartServiceError;
const parseSort = (sort) => {
    if (!sort)
        return { createdAt: -1 };
    const [field, direction = "desc"] = sort.split(":");
    const allowedFields = new Set(["createdAt", "updatedAt"]);
    if (!allowedFields.has(field))
        return { createdAt: -1 };
    return { [field]: direction.toLowerCase() === "asc" ? 1 : -1 };
};
const ensureUserExists = async (userId) => {
    const userExists = await user_model_1.default.exists({ _id: userId });
    if (!userExists)
        throw new CartServiceError("User not found", 404);
};
const ensureProductsExist = async (items) => {
    const productIds = [...new Set(items.map((item) => item.productId))];
    const count = await product_model_1.default.countDocuments({ _id: { $in: productIds } });
    if (count !== productIds.length) {
        throw new CartServiceError("One or more products were not found", 404);
    }
};
exports.CartService = {
    async listCarts(query) {
        const { page, limit, sort, userId } = query;
        const skip = (page - 1) * limit;
        const filter = {};
        if (userId)
            filter.userId = userId;
        const [carts, total] = await Promise.all([
            cart_model_1.default.find(filter).sort(parseSort(sort)).skip(skip).limit(limit),
            cart_model_1.default.countDocuments(filter),
        ]);
        return {
            carts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        };
    },
    async getCartById(cartId) {
        return cart_model_1.default.findById(cartId);
    },
    async createCart(payload) {
        await ensureUserExists(payload.userId);
        await ensureProductsExist(payload.items);
        const existing = await cart_model_1.default.findOne({ userId: payload.userId });
        if (existing) {
            throw new CartServiceError("Cart already exists for this user", 409);
        }
        return cart_model_1.default.create(payload);
    },
    async replaceCart(cartId, payload) {
        await ensureUserExists(payload.userId);
        await ensureProductsExist(payload.items);
        const anotherCartForUser = await cart_model_1.default.findOne({
            userId: payload.userId,
            _id: { $ne: cartId },
        });
        if (anotherCartForUser) {
            throw new CartServiceError("Cart already exists for this user", 409);
        }
        return cart_model_1.default.findByIdAndUpdate(cartId, payload, {
            new: true,
            runValidators: true,
            overwrite: true,
        });
    },
    async updateCart(cartId, payload) {
        if (payload.items)
            await ensureProductsExist(payload.items);
        return cart_model_1.default.findByIdAndUpdate(cartId, payload, {
            new: true,
            runValidators: true,
        });
    },
    async deleteCart(cartId) {
        return cart_model_1.default.findByIdAndDelete(cartId);
    },
};
