"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = exports.ProductServiceError = void 0;
const product_model_1 = __importDefault(require("../models/product.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
class ProductServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "ProductServiceError";
        this.statusCode = statusCode;
    }
}
exports.ProductServiceError = ProductServiceError;
const parseSort = (sort) => {
    if (!sort)
        return { createdAt: -1 };
    const [field, direction = "desc"] = sort.split(":");
    const allowedFields = new Set(["createdAt", "updatedAt", "name", "price"]);
    if (!allowedFields.has(field))
        return { createdAt: -1 };
    return { [field]: direction.toLowerCase() === "asc" ? 1 : -1 };
};
const ensureCategoryExists = async (categoryId) => {
    const categoryExists = await category_model_1.default.exists({ _id: categoryId });
    if (!categoryExists) {
        throw new ProductServiceError("Category not found", 404);
    }
};
exports.ProductService = {
    async listProducts(query) {
        const { page, limit, sort, categoryId } = query;
        const skip = (page - 1) * limit;
        const filter = {};
        if (categoryId) {
            filter.category = categoryId;
        }
        const [products, total] = await Promise.all([
            product_model_1.default.find(filter).populate("category").sort(parseSort(sort)).skip(skip).limit(limit),
            product_model_1.default.countDocuments(filter),
        ]);
        return {
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        };
    },
    async getProductById(productId) {
        return product_model_1.default.findById(productId).populate("category");
    },
    async createProduct(payload) {
        await ensureCategoryExists(payload.category);
        const createdProduct = await product_model_1.default.create(payload);
        const product = await product_model_1.default.findById(createdProduct._id).populate("category");
        if (!product) {
            throw new ProductServiceError("Product not found", 404);
        }
        return product;
    },
    async replaceProduct(productId, payload) {
        await ensureCategoryExists(payload.category);
        return product_model_1.default.findByIdAndUpdate(productId, payload, {
            new: true,
            runValidators: true,
            overwrite: true,
        }).populate("category");
    },
    async updateProduct(productId, payload) {
        if (payload.category) {
            await ensureCategoryExists(payload.category);
        }
        return product_model_1.default.findByIdAndUpdate(productId, payload, {
            new: true,
            runValidators: true,
        }).populate("category");
    },
    async deleteProduct(productId) {
        return product_model_1.default.findByIdAndDelete(productId);
    },
};
