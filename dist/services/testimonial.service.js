"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestimonialService = exports.TestimonialServiceError = void 0;
const testimonial_model_1 = __importDefault(require("../models/testimonial.model"));
class TestimonialServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "TestimonialServiceError";
        this.statusCode = statusCode;
    }
}
exports.TestimonialServiceError = TestimonialServiceError;
const parseSort = (sort) => {
    if (!sort)
        return { createdAt: -1 };
    const [field, direction = "desc"] = sort.split(":");
    const allowedFields = new Set(["createdAt", "updatedAt", "rating"]);
    if (!allowedFields.has(field))
        return { createdAt: -1 };
    return { [field]: direction.toLowerCase() === "asc" ? 1 : -1 };
};
exports.TestimonialService = {
    async listTestimonials(query) {
        const { page, limit, sort } = query;
        const skip = (page - 1) * limit;
        const [testimonials, total] = await Promise.all([
            testimonial_model_1.default.find({}).sort(parseSort(sort)).skip(skip).limit(limit),
            testimonial_model_1.default.countDocuments({}),
        ]);
        return {
            testimonials,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        };
    },
    async getTestimonialById(testimonialId) {
        return testimonial_model_1.default.findById(testimonialId);
    },
    async createTestimonial(payload) {
        return testimonial_model_1.default.create(payload);
    },
    async replaceTestimonial(testimonialId, payload) {
        return testimonial_model_1.default.findByIdAndUpdate(testimonialId, payload, {
            new: true,
            runValidators: true,
            overwrite: true,
        });
    },
    async updateTestimonial(testimonialId, payload) {
        return testimonial_model_1.default.findByIdAndUpdate(testimonialId, payload, {
            new: true,
            runValidators: true,
        });
    },
    async deleteTestimonial(testimonialId) {
        return testimonial_model_1.default.findByIdAndDelete(testimonialId);
    },
};
