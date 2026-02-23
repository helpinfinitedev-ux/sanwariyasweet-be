"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.replaceCategory = exports.createCategory = exports.getCategoryById = exports.listCategories = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const category_service_1 = require("../services/category.service");
const errorResponse = (res, statusCode, message) => {
    return res.status(statusCode).json({
        message,
        result: {},
    });
};
const allowedPayloadFields = new Set(["name", "description", "image"]);
const hasOnlyAllowedFields = (body) => Object.keys(body).every((key) => allowedPayloadFields.has(key));
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const toOptionalString = (value) => {
    if (typeof value !== "string")
        return undefined;
    return value.trim();
};
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
const getRouteParam = (value) => {
    if (typeof value === "string")
        return value;
    if (Array.isArray(value) && value.length > 0)
        return value[0];
    return null;
};
const mapServiceError = (res, error) => {
    if (error instanceof category_service_1.CategoryServiceError) {
        return errorResponse(res, error.statusCode, error.message);
    }
    if (error instanceof mongoose_1.default.Error.ValidationError) {
        return errorResponse(res, 400, error.message);
    }
    console.error("Category controller error:", error);
    return errorResponse(res, 500, "Internal server error");
};
const buildCreatePayload = (body) => {
    if (!hasOnlyAllowedFields(body))
        return null;
    if (!isNonEmptyString(body.name))
        return null;
    return {
        name: body.name.trim(),
        description: toOptionalString(body.description),
        image: toOptionalString(body.image),
    };
};
const buildPatchPayload = (body) => {
    if (!hasOnlyAllowedFields(body))
        return null;
    const payload = {};
    if ("name" in body) {
        if (!isNonEmptyString(body.name))
            return null;
        payload.name = body.name.trim();
    }
    if ("description" in body) {
        if (typeof body.description !== "string")
            return null;
        payload.description = body.description.trim();
    }
    if ("image" in body) {
        if (typeof body.image !== "string")
            return null;
        payload.image = body.image.trim();
    }
    if (Object.keys(payload).length === 0) {
        return null;
    }
    return payload;
};
const listCategories = async (req, res) => {
    try {
        const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
        const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
        const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
        const result = await category_service_1.CategoryService.listCategories({ page, limit, sort });
        return res.status(200).json({
            message: "Categories fetched successfully",
            result,
        });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.listCategories = listCategories;
const getCategoryById = async (req, res) => {
    try {
        const categoryId = getRouteParam(req.params.categoryId);
        if (!categoryId || !validateObjectId(categoryId)) {
            return errorResponse(res, 400, "Invalid category id");
        }
        const category = await category_service_1.CategoryService.getCategoryById(categoryId);
        if (!category) {
            return errorResponse(res, 404, "Category not found");
        }
        return res.status(200).json({
            message: "Category fetched successfully",
            result: { category },
        });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.getCategoryById = getCategoryById;
const createCategory = async (req, res) => {
    try {
        const payload = buildCreatePayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body. Required fields: name");
        }
        const category = await category_service_1.CategoryService.createCategory(payload);
        return res.status(201).json({
            message: "Category created successfully",
            result: { category },
        });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.createCategory = createCategory;
const replaceCategory = async (req, res) => {
    try {
        const categoryId = getRouteParam(req.params.categoryId);
        if (!categoryId || !validateObjectId(categoryId)) {
            return errorResponse(res, 400, "Invalid category id");
        }
        const payload = buildCreatePayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body. Required fields: name");
        }
        const category = await category_service_1.CategoryService.replaceCategory(categoryId, payload);
        if (!category) {
            return errorResponse(res, 404, "Category not found");
        }
        return res.status(200).json({
            message: "Category replaced successfully",
            result: { category },
        });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.replaceCategory = replaceCategory;
const updateCategory = async (req, res) => {
    try {
        const categoryId = getRouteParam(req.params.categoryId);
        if (!categoryId || !validateObjectId(categoryId)) {
            return errorResponse(res, 400, "Invalid category id");
        }
        const payload = buildPatchPayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body for update");
        }
        const category = await category_service_1.CategoryService.updateCategory(categoryId, payload);
        if (!category) {
            return errorResponse(res, 404, "Category not found");
        }
        return res.status(200).json({
            message: "Category updated successfully",
            result: { category },
        });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const categoryId = getRouteParam(req.params.categoryId);
        if (!categoryId || !validateObjectId(categoryId)) {
            return errorResponse(res, 400, "Invalid category id");
        }
        const category = await category_service_1.CategoryService.deleteCategory(categoryId);
        if (!category) {
            return errorResponse(res, 404, "Category not found");
        }
        return res.status(200).json({
            message: "Category deleted successfully",
            result: { category },
        });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.deleteCategory = deleteCategory;
