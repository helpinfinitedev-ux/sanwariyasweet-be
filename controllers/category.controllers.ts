import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  CategoryService,
  CategoryServiceError,
  type CreateCategoryPayload,
  type UpdateCategoryPayload,
} from "../services/category.service";

const errorResponse = (res: Response, statusCode: number, message: string): Response => {
  return res.status(statusCode).json({
    message,
    result: {},
  });
};

const allowedPayloadFields = new Set(["name", "description", "image"]);

const hasOnlyAllowedFields = (body: Record<string, unknown>): boolean =>
  Object.keys(body).every((key) => allowedPayloadFields.has(key));

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  return value.trim();
};

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

const getRouteParam = (value: string | string[] | undefined): string | null => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return value[0];
  return null;
};

const mapServiceError = (res: Response, error: unknown): Response => {
  if (error instanceof CategoryServiceError) {
    return errorResponse(res, error.statusCode, error.message);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return errorResponse(res, 400, error.message);
  }

  console.error("Category controller error:", error);
  return errorResponse(res, 500, "Internal server error");
};

const buildCreatePayload = (body: Record<string, unknown>): CreateCategoryPayload | null => {
  if (!hasOnlyAllowedFields(body)) return null;
  if (!isNonEmptyString(body.name)) return null;

  return {
    name: body.name.trim(),
    description: toOptionalString(body.description),
    image: toOptionalString(body.image),
  };
};

const buildPatchPayload = (body: Record<string, unknown>): UpdateCategoryPayload | null => {
  if (!hasOnlyAllowedFields(body)) return null;
  const payload: UpdateCategoryPayload = {};

  if ("name" in body) {
    if (!isNonEmptyString(body.name)) return null;
    payload.name = body.name.trim();
  }

  if ("description" in body) {
    if (typeof body.description !== "string") return null;
    payload.description = body.description.trim();
  }

  if ("image" in body) {
    if (typeof body.image !== "string") return null;
    payload.image = body.image.trim();
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  return payload;
};

export const listCategories = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
    const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;

    const result = await CategoryService.listCategories({ page, limit, sort });

    return res.status(200).json({
      message: "Categories fetched successfully",
      result,
    });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const categoryId = getRouteParam(req.params.categoryId);

    if (!categoryId || !validateObjectId(categoryId)) {
      return errorResponse(res, 400, "Invalid category id");
    }

    const category = await CategoryService.getCategoryById(categoryId);
    if (!category) {
      return errorResponse(res, 404, "Category not found");
    }

    return res.status(200).json({
      message: "Category fetched successfully",
      result: { category },
    });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const createCategory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const payload = buildCreatePayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(res, 400, "Invalid request body. Required fields: name");
    }

    const category = await CategoryService.createCategory(payload);

    return res.status(201).json({
      message: "Category created successfully",
      result: { category },
    });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const replaceCategory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const categoryId = getRouteParam(req.params.categoryId);
    if (!categoryId || !validateObjectId(categoryId)) {
      return errorResponse(res, 400, "Invalid category id");
    }

    const payload = buildCreatePayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(res, 400, "Invalid request body. Required fields: name");
    }

    const category = await CategoryService.replaceCategory(categoryId, payload);
    if (!category) {
      return errorResponse(res, 404, "Category not found");
    }

    return res.status(200).json({
      message: "Category replaced successfully",
      result: { category },
    });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const categoryId = getRouteParam(req.params.categoryId);
    if (!categoryId || !validateObjectId(categoryId)) {
      return errorResponse(res, 400, "Invalid category id");
    }

    const payload = buildPatchPayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(res, 400, "Invalid request body for update");
    }

    const category = await CategoryService.updateCategory(categoryId, payload);
    if (!category) {
      return errorResponse(res, 404, "Category not found");
    }

    return res.status(200).json({
      message: "Category updated successfully",
      result: { category },
    });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const categoryId = getRouteParam(req.params.categoryId);
    if (!categoryId || !validateObjectId(categoryId)) {
      return errorResponse(res, 400, "Invalid category id");
    }

    const category = await CategoryService.deleteCategory(categoryId);
    if (!category) {
      return errorResponse(res, 404, "Category not found");
    }

    return res.status(200).json({
      message: "Category deleted successfully",
      result: { category },
    });
  } catch (error) {
    return mapServiceError(res, error);
  }
};
