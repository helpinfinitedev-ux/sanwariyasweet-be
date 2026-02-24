"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTestimonial = exports.updateTestimonial = exports.replaceTestimonial = exports.createTestimonial = exports.getTestimonialById = exports.listTestimonials = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const testimonial_service_1 = require("../services/testimonial.service");
const errorResponse = (res, statusCode, message) => res.status(statusCode).json({ message, result: {} });
const allowedFields = new Set(["rating", "comment", "images"]);
const hasOnlyAllowedFields = (body) => Object.keys(body).every((key) => allowedFields.has(key));
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
    if (!Number.isFinite(parsed))
        return null;
    if (parsed < 1 || parsed > 5)
        return null;
    return parsed;
};
const toImages = (value) => {
    if (!Array.isArray(value))
        return null;
    const images = value
        .map((image) => (typeof image === "string" ? image.trim() : ""))
        .filter(Boolean);
    return images;
};
const getRouteParam = (value) => {
    if (typeof value === "string")
        return value;
    if (Array.isArray(value) && value.length > 0)
        return value[0];
    return null;
};
const buildCreatePayload = (body) => {
    if (!hasOnlyAllowedFields(body))
        return null;
    const rating = toRating(body.rating);
    if (rating === null)
        return null;
    if (!isNonEmptyString(body.comment))
        return null;
    const payload = {
        rating,
        comment: body.comment.trim(),
    };
    if ("images" in body) {
        const images = toImages(body.images);
        if (images === null)
            return null;
        payload.images = images;
    }
    return payload;
};
const buildPatchPayload = (body) => {
    if (!hasOnlyAllowedFields(body))
        return null;
    const payload = {};
    if ("rating" in body) {
        const rating = toRating(body.rating);
        if (rating === null)
            return null;
        payload.rating = rating;
    }
    if ("comment" in body) {
        if (!isNonEmptyString(body.comment))
            return null;
        payload.comment = body.comment.trim();
    }
    if ("images" in body) {
        const images = toImages(body.images);
        if (images === null)
            return null;
        payload.images = images;
    }
    if (Object.keys(payload).length === 0)
        return null;
    return payload;
};
const mapServiceError = (res, error) => {
    if (error instanceof testimonial_service_1.TestimonialServiceError) {
        return errorResponse(res, error.statusCode, error.message);
    }
    if (error instanceof mongoose_1.default.Error.ValidationError) {
        return errorResponse(res, 400, error.message);
    }
    console.error("Testimonial controller error:", error);
    return errorResponse(res, 500, "Internal server error");
};
const listTestimonials = async (req, res) => {
    try {
        const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
        const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
        const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
        const result = await testimonial_service_1.TestimonialService.listTestimonials({ page, limit, sort });
        return res.status(200).json({ message: "Testimonials fetched successfully", result });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.listTestimonials = listTestimonials;
const getTestimonialById = async (req, res) => {
    try {
        const testimonialId = getRouteParam(req.params.testimonialId);
        if (!testimonialId || !validateObjectId(testimonialId)) {
            return errorResponse(res, 400, "Invalid testimonial id");
        }
        const testimonial = await testimonial_service_1.TestimonialService.getTestimonialById(testimonialId);
        if (!testimonial)
            return errorResponse(res, 404, "Testimonial not found");
        return res
            .status(200)
            .json({ message: "Testimonial fetched successfully", result: { testimonial } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.getTestimonialById = getTestimonialById;
const createTestimonial = async (req, res) => {
    try {
        const payload = buildCreatePayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body. Required fields: rating, comment");
        }
        const testimonial = await testimonial_service_1.TestimonialService.createTestimonial(payload);
        return res
            .status(201)
            .json({ message: "Testimonial created successfully", result: { testimonial } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.createTestimonial = createTestimonial;
const replaceTestimonial = async (req, res) => {
    try {
        const testimonialId = getRouteParam(req.params.testimonialId);
        if (!testimonialId || !validateObjectId(testimonialId)) {
            return errorResponse(res, 400, "Invalid testimonial id");
        }
        const payload = buildCreatePayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body. Required fields: rating, comment");
        }
        const testimonial = await testimonial_service_1.TestimonialService.replaceTestimonial(testimonialId, payload);
        if (!testimonial)
            return errorResponse(res, 404, "Testimonial not found");
        return res
            .status(200)
            .json({ message: "Testimonial replaced successfully", result: { testimonial } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.replaceTestimonial = replaceTestimonial;
const updateTestimonial = async (req, res) => {
    try {
        const testimonialId = getRouteParam(req.params.testimonialId);
        if (!testimonialId || !validateObjectId(testimonialId)) {
            return errorResponse(res, 400, "Invalid testimonial id");
        }
        const payload = buildPatchPayload(req.body);
        if (!payload)
            return errorResponse(res, 400, "Invalid request body for update");
        const testimonial = await testimonial_service_1.TestimonialService.updateTestimonial(testimonialId, payload);
        if (!testimonial)
            return errorResponse(res, 404, "Testimonial not found");
        return res
            .status(200)
            .json({ message: "Testimonial updated successfully", result: { testimonial } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.updateTestimonial = updateTestimonial;
const deleteTestimonial = async (req, res) => {
    try {
        const testimonialId = getRouteParam(req.params.testimonialId);
        if (!testimonialId || !validateObjectId(testimonialId)) {
            return errorResponse(res, 400, "Invalid testimonial id");
        }
        const testimonial = await testimonial_service_1.TestimonialService.deleteTestimonial(testimonialId);
        if (!testimonial)
            return errorResponse(res, 404, "Testimonial not found");
        return res
            .status(200)
            .json({ message: "Testimonial deleted successfully", result: { testimonial } });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.deleteTestimonial = deleteTestimonial;
