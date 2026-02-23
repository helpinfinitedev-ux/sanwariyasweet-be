"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.replaceProduct = exports.createProduct = exports.getProductById = exports.listProducts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const product_service_1 = require("../services/product.service");
const errorResponse = (res, statusCode, message) => {
    return res.status(statusCode).json({
        message,
        result: {},
    });
};
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const allowedPayloadFields = new Set(["name", "description", "images", "price", "category"]);
const hasOnlyAllowedFields = (body) => Object.keys(body).every((key) => allowedPayloadFields.has(key));
const toOptionalString = (value) => {
    if (typeof value !== "string")
        return undefined;
    return value.trim();
};
const toValidImages = (value) => {
    if (!Array.isArray(value) || value.length === 0)
        return null;
    const images = value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0);
    if (images.length === 0)
        return null;
    return images;
};
const toValidPrice = (value) => {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0)
        return null;
    return parsed;
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
    if (error instanceof product_service_1.ProductServiceError) {
        return errorResponse(res, error.statusCode, error.message);
    }
    if (error instanceof mongoose_1.default.Error.ValidationError) {
        return errorResponse(res, 400, error.message);
    }
    console.error("Product controller error:", error);
    return errorResponse(res, 500, "Internal server error");
};
const buildCreatePayload = (body) => {
    if (!hasOnlyAllowedFields(body))
        return null;
    if (!isNonEmptyString(body.name))
        return null;
    if (!isNonEmptyString(body.category))
        return null;
    const price = toValidPrice(body.price);
    if (price === null)
        return null;
    const images = toValidImages(body.images);
    if (!images)
        return null;
    return {
        name: body.name.trim(),
        description: toOptionalString(body.description),
        images,
        price,
        category: body.category.trim(),
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
    if ("images" in body) {
        const images = toValidImages(body.images);
        if (!images)
            return null;
        payload.images = images;
    }
    if ("price" in body) {
        const price = toValidPrice(body.price);
        if (price === null)
            return null;
        payload.price = price;
    }
    if ("category" in body) {
        if (!isNonEmptyString(body.category))
            return null;
        payload.category = body.category.trim();
    }
    if (Object.keys(payload).length === 0) {
        return null;
    }
    return payload;
};
const listProducts = async (req, res) => {
    try {
        const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
        const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
        const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
        const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
        if (categoryId && !validateObjectId(categoryId)) {
            return errorResponse(res, 400, "Invalid category id");
        }
        const result = await product_service_1.ProductService.listProducts({ page, limit, sort, categoryId });
        return res.status(200).json({
            message: "Products fetched successfully",
            result,
        });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.listProducts = listProducts;
const getProductById = async (req, res) => {
    try {
        const productId = getRouteParam(req.params.productId);
        if (!productId || !validateObjectId(productId)) {
            return errorResponse(res, 400, "Invalid product id");
        }
        const product = await product_service_1.ProductService.getProductById(productId);
        if (!product) {
            return errorResponse(res, 404, "Product not found");
        }
        return res.status(200).json({
            message: "Product fetched successfully",
            result: { product },
        });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    try {
        const payload = buildCreatePayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body. Required fields: name, images, price, category");
        }
        if (!validateObjectId(payload.category)) {
            return errorResponse(res, 400, "Invalid category id");
        }
        const product = await product_service_1.ProductService.createProduct(payload);
        return res.status(201).json({
            message: "Product created successfully",
            result: { product },
        });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.createProduct = createProduct;
const replaceProduct = async (req, res) => {
    try {
        const productId = getRouteParam(req.params.productId);
        if (!productId || !validateObjectId(productId)) {
            return errorResponse(res, 400, "Invalid product id");
        }
        const payload = buildCreatePayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body. Required fields: name, images, price, category");
        }
        if (!validateObjectId(payload.category)) {
            return errorResponse(res, 400, "Invalid category id");
        }
        const product = await product_service_1.ProductService.replaceProduct(productId, payload);
        if (!product) {
            return errorResponse(res, 404, "Product not found");
        }
        return res.status(200).json({
            message: "Product replaced successfully",
            result: { product },
        });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.replaceProduct = replaceProduct;
const updateProduct = async (req, res) => {
    try {
        const productId = getRouteParam(req.params.productId);
        if (!productId || !validateObjectId(productId)) {
            return errorResponse(res, 400, "Invalid product id");
        }
        const payload = buildPatchPayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body for update");
        }
        if (payload.category && !validateObjectId(payload.category)) {
            return errorResponse(res, 400, "Invalid category id");
        }
        const product = await product_service_1.ProductService.updateProduct(productId, payload);
        if (!product) {
            return errorResponse(res, 404, "Product not found");
        }
        return res.status(200).json({
            message: "Product updated successfully",
            result: { product },
        });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const productId = getRouteParam(req.params.productId);
        if (!productId || !validateObjectId(productId)) {
            return errorResponse(res, 400, "Invalid product id");
        }
        const product = await product_service_1.ProductService.deleteProduct(productId);
        if (!product) {
            return errorResponse(res, 404, "Product not found");
        }
        return res.status(200).json({
            message: "Product deleted successfully",
            result: { product },
        });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.deleteProduct = deleteProduct;
