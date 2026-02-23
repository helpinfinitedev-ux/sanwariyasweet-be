"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = exports.OrderServiceError = void 0;
const order_model_1 = __importDefault(require("../models/order.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
class OrderServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "OrderServiceError";
        this.statusCode = statusCode;
    }
}
exports.OrderServiceError = OrderServiceError;
const parseSort = (sort) => {
    if (!sort)
        return { createdAt: -1 };
    const [field, direction = "desc"] = sort.split(":");
    const allowedFields = new Set(["createdAt", "updatedAt", "expectedDeliveryDate"]);
    if (!allowedFields.has(field))
        return { createdAt: -1 };
    return { [field]: direction.toLowerCase() === "asc" ? 1 : -1 };
};
const ensureUserExists = async (userId) => {
    const userExists = await user_model_1.default.exists({ _id: userId });
    if (!userExists)
        throw new OrderServiceError("User not found", 404);
};
const ensureProductsExist = async (items) => {
    const productIds = [...new Set(items.map((item) => item.productId))];
    const count = await product_model_1.default.countDocuments({ _id: { $in: productIds } });
    if (count !== productIds.length) {
        throw new OrderServiceError("One or more products were not found", 404);
    }
};
const calculateTotalAmount = (items) => items.reduce((acc, item) => acc + item.price * item.quantity, 0);
exports.OrderService = {
    async listOrders(query) {
        const { page, limit, sort, userId, status } = query;
        const skip = (page - 1) * limit;
        const filter = {};
        if (userId)
            filter.userId = userId;
        if (status)
            filter.status = status;
        const [orders, total] = await Promise.all([
            order_model_1.default.find(filter).sort(parseSort(sort)).skip(skip).limit(limit),
            order_model_1.default.countDocuments(filter),
        ]);
        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        };
    },
    async getOrderById(orderId) {
        return order_model_1.default.findById(orderId);
    },
    async createOrder(payload) {
        await ensureUserExists(payload.userId);
        await ensureProductsExist(payload.items);
        return order_model_1.default.create({
            ...payload,
            totalAmount: calculateTotalAmount(payload.items),
        });
    },
    async replaceOrder(orderId, payload) {
        await ensureUserExists(payload.userId);
        await ensureProductsExist(payload.items);
        return order_model_1.default.findByIdAndUpdate(orderId, { ...payload, totalAmount: calculateTotalAmount(payload.items) }, {
            new: true,
            runValidators: true,
            overwrite: true,
        });
    },
    async updateOrder(orderId, payload) {
        const updatePayload = { ...payload };
        if (payload.items) {
            await ensureProductsExist(payload.items);
            updatePayload.totalAmount = calculateTotalAmount(payload.items);
        }
        return order_model_1.default.findByIdAndUpdate(orderId, updatePayload, {
            new: true,
            runValidators: true,
        });
    },
    async deleteOrder(orderId) {
        return order_model_1.default.findByIdAndDelete(orderId);
    },
};
