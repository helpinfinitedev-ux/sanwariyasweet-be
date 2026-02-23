"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = exports.CategoryServiceError = void 0;
const category_model_1 = __importDefault(require("../models/category.model"));
class CategoryServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "CategoryServiceError";
        this.statusCode = statusCode;
    }
}
exports.CategoryServiceError = CategoryServiceError;
const parseSort = (sort) => {
    if (!sort)
        return { createdAt: -1 };
    const [field, direction = "desc"] = sort.split(":");
    const allowedFields = new Set(["createdAt", "updatedAt", "name"]);
    if (!allowedFields.has(field))
        return { createdAt: -1 };
    return { [field]: direction.toLowerCase() === "asc" ? 1 : -1 };
};
const ensureCategoryNameIsUnique = async (name, categoryIdToExclude) => {
    const existingCategory = await category_model_1.default.findOne({
        name,
        ...(categoryIdToExclude ? { _id: { $ne: categoryIdToExclude } } : {}),
    });
    if (existingCategory) {
        throw new CategoryServiceError("Category with this name already exists", 409);
    }
};
exports.CategoryService = {
    async listCategories(query) {
        const { page, limit, sort } = query;
        const skip = (page - 1) * limit;
        const [categories, total] = await Promise.all([
            category_model_1.default.find({}).sort(parseSort(sort)).skip(skip).limit(limit),
            category_model_1.default.countDocuments({}),
        ]);
        return {
            categories,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        };
    },
    async getCategoryById(categoryId) {
        return category_model_1.default.findById(categoryId);
    },
    async createCategory(payload) {
        await ensureCategoryNameIsUnique(payload.name);
        return category_model_1.default.create(payload);
    },
    async replaceCategory(categoryId, payload) {
        await ensureCategoryNameIsUnique(payload.name, categoryId);
        return category_model_1.default.findByIdAndUpdate(categoryId, payload, {
            new: true,
            runValidators: true,
            overwrite: true,
        });
    },
    async updateCategory(categoryId, payload) {
        if (payload.name) {
            await ensureCategoryNameIsUnique(payload.name, categoryId);
        }
        return category_model_1.default.findByIdAndUpdate(categoryId, payload, {
            new: true,
            runValidators: true,
        });
    },
    async deleteCategory(categoryId) {
        return category_model_1.default.findByIdAndDelete(categoryId);
    },
};
