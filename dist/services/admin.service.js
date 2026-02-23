"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const order_model_1 = __importDefault(require("../models/order.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const parseSort = (sort, allowedFields) => {
    if (!sort)
        return { createdAt: -1 };
    const [field, direction = "desc"] = sort.split(":");
    if (!allowedFields.includes(field))
        return { createdAt: -1 };
    return { [field]: direction.toLowerCase() === "asc" ? 1 : -1 };
};
const paginate = async (modelQuery, countQuery, page, limit) => {
    const [data, total] = await Promise.all([modelQuery, countQuery]);
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
};
exports.AdminService = {
    async listAllOrders(query) {
        const { page, limit, sort } = query;
        const skip = (page - 1) * limit;
        const result = await paginate(order_model_1.default.find({}).sort(parseSort(sort, ["createdAt", "updatedAt", "expectedDeliveryDate"])).skip(skip).limit(limit), order_model_1.default.countDocuments({}), page, limit);
        return { orders: result.data, pagination: result.pagination };
    },
    async listAllProducts(query) {
        const { page, limit, sort } = query;
        const skip = (page - 1) * limit;
        const result = await paginate(product_model_1.default.find({}).sort(parseSort(sort, ["createdAt", "updatedAt", "name", "price"])).skip(skip).limit(limit), product_model_1.default.countDocuments({}), page, limit);
        return { products: result.data, pagination: result.pagination };
    },
    async listAllUsers(query) {
        const { page, limit, sort } = query;
        const skip = (page - 1) * limit;
        const result = await paginate(user_model_1.default.find({}).select("-password").sort(parseSort(sort, ["createdAt", "updatedAt", "firstName", "phoneNumber"])).skip(skip).limit(limit), user_model_1.default.countDocuments({}), page, limit);
        return { users: result.data, pagination: result.pagination };
    },
};
