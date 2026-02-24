import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  RatingService,
  RatingServiceError,
  type CreateRatingPayload,
  type UpdateRatingPayload,
} from "../services/rating.service";

const errorResponse = (res: Response, statusCode: number, message: string): Response =>
  res.status(statusCode).json({ message, result: {} });

const createAllowedFields = new Set(["userId", "productId", "rating", "comment"]);
const patchAllowedFields = new Set(["rating", "comment"]);

const hasOnlyAllowedFields = (
  body: Record<string, unknown>,
  allowed: Set<string>
): boolean => Object.keys(body).every((key) => allowed.has(key));

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
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) return null;
  return parsed;
};

const getRouteParam = (value: string | string[] | undefined): string | null => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return value[0];
  return null;
};

const buildCreatePayload = (body: Record<string, unknown>): CreateRatingPayload | null => {
  if (!hasOnlyAllowedFields(body, createAllowedFields)) return null;
  if (!isNonEmptyString(body.userId) || !validateObjectId(body.userId.trim())) return null;
  if (!isNonEmptyString(body.productId) || !validateObjectId(body.productId.trim())) return null;

  const rating = toRating(body.rating);
  if (rating === null) return null;

  const payload: CreateRatingPayload = {
    userId: body.userId.trim(),
    productId: body.productId.trim(),
    rating,
  };

  if ("comment" in body) {
    if (typeof body.comment !== "string") return null;
    payload.comment = body.comment.trim();
  }

  return payload;
};

const buildPatchPayload = (body: Record<string, unknown>): UpdateRatingPayload | null => {
  if (!hasOnlyAllowedFields(body, patchAllowedFields)) return null;

  const payload: UpdateRatingPayload = {};

  if ("rating" in body) {
    const rating = toRating(body.rating);
    if (rating === null) return null;
    payload.rating = rating;
  }

  if ("comment" in body) {
    if (typeof body.comment !== "string") return null;
    payload.comment = body.comment.trim();
  }

  if (Object.keys(payload).length === 0) return null;
  return payload;
};

const mapServiceError = (res: Response, error: unknown): Response => {
  if (error instanceof RatingServiceError) return errorResponse(res, error.statusCode, error.message);
  if (error instanceof mongoose.Error.ValidationError) return errorResponse(res, 400, error.message);
  console.error("Rating controller error:", error);
  return errorResponse(res, 500, "Internal server error");
};

export const listRatings = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
    const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const productId =
      typeof req.query.productId === "string" ? req.query.productId : undefined;

    if (userId && !validateObjectId(userId)) return errorResponse(res, 400, "Invalid user id");
    if (productId && !validateObjectId(productId)) {
      return errorResponse(res, 400, "Invalid product id");
    }

    const result = await RatingService.listRatings({ page, limit, sort, userId, productId });
    return res.status(200).json({ message: "Ratings fetched successfully", result });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const getRatingById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const ratingId = getRouteParam(req.params.ratingId);
    if (!ratingId || !validateObjectId(ratingId)) return errorResponse(res, 400, "Invalid rating id");

    const rating = await RatingService.getRatingById(ratingId);
    if (!rating) return errorResponse(res, 404, "Rating not found");

    return res.status(200).json({ message: "Rating fetched successfully", result: { rating } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const createRating = async (req: Request, res: Response): Promise<Response> => {
  try {
    const payload = buildCreatePayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(
        res,
        400,
        "Invalid request body. Required fields: userId, productId, rating"
      );
    }

    const rating = await RatingService.createRating(payload);
    return res.status(201).json({ message: "Rating created successfully", result: { rating } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const replaceRating = async (req: Request, res: Response): Promise<Response> => {
  try {
    const ratingId = getRouteParam(req.params.ratingId);
    if (!ratingId || !validateObjectId(ratingId)) return errorResponse(res, 400, "Invalid rating id");

    const payload = buildCreatePayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(
        res,
        400,
        "Invalid request body. Required fields: userId, productId, rating"
      );
    }

    const rating = await RatingService.replaceRating(ratingId, payload);
    if (!rating) return errorResponse(res, 404, "Rating not found");

    return res.status(200).json({ message: "Rating replaced successfully", result: { rating } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const updateRating = async (req: Request, res: Response): Promise<Response> => {
  try {
    const ratingId = getRouteParam(req.params.ratingId);
    if (!ratingId || !validateObjectId(ratingId)) return errorResponse(res, 400, "Invalid rating id");

    const payload = buildPatchPayload(req.body as Record<string, unknown>);
    if (!payload) return errorResponse(res, 400, "Invalid request body for update");

    const rating = await RatingService.updateRating(ratingId, payload);
    if (!rating) return errorResponse(res, 404, "Rating not found");

    return res.status(200).json({ message: "Rating updated successfully", result: { rating } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const deleteRating = async (req: Request, res: Response): Promise<Response> => {
  try {
    const ratingId = getRouteParam(req.params.ratingId);
    if (!ratingId || !validateObjectId(ratingId)) return errorResponse(res, 400, "Invalid rating id");

    const rating = await RatingService.deleteRating(ratingId);
    if (!rating) return errorResponse(res, 404, "Rating not found");

    return res.status(200).json({ message: "Rating deleted successfully", result: { rating } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};
