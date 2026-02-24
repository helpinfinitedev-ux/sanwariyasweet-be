import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  TestimonialService,
  TestimonialServiceError,
  type CreateTestimonialPayload,
  type UpdateTestimonialPayload,
} from "../services/testimonial.service";

const errorResponse = (res: Response, statusCode: number, message: string): Response =>
  res.status(statusCode).json({ message, result: {} });

const allowedFields = new Set(["rating", "comment", "images"]);

const hasOnlyAllowedFields = (body: Record<string, unknown>): boolean =>
  Object.keys(body).every((key) => allowedFields.has(key));

const parsePaginationNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const integer = Math.trunc(parsed);
  if (integer < min) return min;
  if (integer > max) return max;
  return integer;
};

const validateObjectId = (value: string): boolean => mongoose.Types.ObjectId.isValid(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const toRating = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 1 || parsed > 5) return null;
  return parsed;
};

const toImages = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const images = value
    .map((image) => (typeof image === "string" ? image.trim() : ""))
    .filter(Boolean);
  return images;
};

const getRouteParam = (value: string | string[] | undefined): string | null => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return value[0];
  return null;
};

const buildCreatePayload = (
  body: Record<string, unknown>
): CreateTestimonialPayload | null => {
  if (!hasOnlyAllowedFields(body)) return null;
  const rating = toRating(body.rating);
  if (rating === null) return null;
  if (!isNonEmptyString(body.comment)) return null;

  const payload: CreateTestimonialPayload = {
    rating,
    comment: body.comment.trim(),
  };

  if ("images" in body) {
    const images = toImages(body.images);
    if (images === null) return null;
    payload.images = images;
  }

  return payload;
};

const buildPatchPayload = (
  body: Record<string, unknown>
): UpdateTestimonialPayload | null => {
  if (!hasOnlyAllowedFields(body)) return null;
  const payload: UpdateTestimonialPayload = {};

  if ("rating" in body) {
    const rating = toRating(body.rating);
    if (rating === null) return null;
    payload.rating = rating;
  }

  if ("comment" in body) {
    if (!isNonEmptyString(body.comment)) return null;
    payload.comment = body.comment.trim();
  }

  if ("images" in body) {
    const images = toImages(body.images);
    if (images === null) return null;
    payload.images = images;
  }

  if (Object.keys(payload).length === 0) return null;
  return payload;
};

const mapServiceError = (res: Response, error: unknown): Response => {
  if (error instanceof TestimonialServiceError) {
    return errorResponse(res, error.statusCode, error.message);
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return errorResponse(res, 400, error.message);
  }
  console.error("Testimonial controller error:", error);
  return errorResponse(res, 500, "Internal server error");
};

export const listTestimonials = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
    const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;

    const result = await TestimonialService.listTestimonials({ page, limit, sort });
    return res.status(200).json({ message: "Testimonials fetched successfully", result });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const getTestimonialById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const testimonialId = getRouteParam(req.params.testimonialId);
    if (!testimonialId || !validateObjectId(testimonialId)) {
      return errorResponse(res, 400, "Invalid testimonial id");
    }

    const testimonial = await TestimonialService.getTestimonialById(testimonialId);
    if (!testimonial) return errorResponse(res, 404, "Testimonial not found");

    return res
      .status(200)
      .json({ message: "Testimonial fetched successfully", result: { testimonial } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const createTestimonial = async (req: Request, res: Response): Promise<Response> => {
  try {
    const payload = buildCreatePayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(res, 400, "Invalid request body. Required fields: rating, comment");
    }

    const testimonial = await TestimonialService.createTestimonial(payload);
    return res
      .status(201)
      .json({ message: "Testimonial created successfully", result: { testimonial } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const replaceTestimonial = async (req: Request, res: Response): Promise<Response> => {
  try {
    const testimonialId = getRouteParam(req.params.testimonialId);
    if (!testimonialId || !validateObjectId(testimonialId)) {
      return errorResponse(res, 400, "Invalid testimonial id");
    }

    const payload = buildCreatePayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(res, 400, "Invalid request body. Required fields: rating, comment");
    }

    const testimonial = await TestimonialService.replaceTestimonial(testimonialId, payload);
    if (!testimonial) return errorResponse(res, 404, "Testimonial not found");

    return res
      .status(200)
      .json({ message: "Testimonial replaced successfully", result: { testimonial } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const updateTestimonial = async (req: Request, res: Response): Promise<Response> => {
  try {
    const testimonialId = getRouteParam(req.params.testimonialId);
    if (!testimonialId || !validateObjectId(testimonialId)) {
      return errorResponse(res, 400, "Invalid testimonial id");
    }

    const payload = buildPatchPayload(req.body as Record<string, unknown>);
    if (!payload) return errorResponse(res, 400, "Invalid request body for update");

    const testimonial = await TestimonialService.updateTestimonial(testimonialId, payload);
    if (!testimonial) return errorResponse(res, 404, "Testimonial not found");

    return res
      .status(200)
      .json({ message: "Testimonial updated successfully", result: { testimonial } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const deleteTestimonial = async (req: Request, res: Response): Promise<Response> => {
  try {
    const testimonialId = getRouteParam(req.params.testimonialId);
    if (!testimonialId || !validateObjectId(testimonialId)) {
      return errorResponse(res, 400, "Invalid testimonial id");
    }

    const testimonial = await TestimonialService.deleteTestimonial(testimonialId);
    if (!testimonial) return errorResponse(res, 404, "Testimonial not found");

    return res
      .status(200)
      .json({ message: "Testimonial deleted successfully", result: { testimonial } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};
