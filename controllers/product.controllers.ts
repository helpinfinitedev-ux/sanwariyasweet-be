import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  ProductService,
  ProductServiceError,
  type CreateProductPayload,
  type UpdateProductPayload,
} from "../services/product.service";

const errorResponse = (res: Response, statusCode: number, message: string): Response => {
  return res.status(statusCode).json({
    message,
    result: {},
  });
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const allowedPayloadFields = new Set(["name", "description", "images", "price", "category"]);

const hasOnlyAllowedFields = (body: Record<string, unknown>): boolean =>
  Object.keys(body).every((key) => allowedPayloadFields.has(key));

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  return value.trim();
};

const toValidImages = (value: unknown): string[] | null => {
  if (!Array.isArray(value) || value.length === 0) return null;

  const images = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);

  if (images.length === 0) return null;
  return images;
};

const toValidPrice = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
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
  if (error instanceof ProductServiceError) {
    return errorResponse(res, error.statusCode, error.message);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return errorResponse(res, 400, error.message);
  }

  console.error("Product controller error:", error);
  return errorResponse(res, 500, "Internal server error");
};

const buildCreatePayload = (body: Record<string, unknown>): CreateProductPayload | null => {
  if (!hasOnlyAllowedFields(body)) return null;
  if (!isNonEmptyString(body.name)) return null;
  if (!isNonEmptyString(body.category)) return null;

  const price = toValidPrice(body.price);
  if (price === null) return null;

  const images = toValidImages(body.images);
  if (!images) return null;

  return {
    name: body.name.trim(),
    description: toOptionalString(body.description),
    images,
    price,
    category: body.category.trim(),
  };
};

const buildPatchPayload = (body: Record<string, unknown>): UpdateProductPayload | null => {
  if (!hasOnlyAllowedFields(body)) return null;

  const payload: UpdateProductPayload = {};

  if ("name" in body) {
    if (!isNonEmptyString(body.name)) return null;
    payload.name = body.name.trim();
  }

  if ("description" in body) {
    if (typeof body.description !== "string") return null;
    payload.description = body.description.trim();
  }

  if ("images" in body) {
    const images = toValidImages(body.images);
    if (!images) return null;
    payload.images = images;
  }

  if ("price" in body) {
    const price = toValidPrice(body.price);
    if (price === null) return null;
    payload.price = price;
  }

  if ("category" in body) {
    if (!isNonEmptyString(body.category)) return null;
    payload.category = body.category.trim();
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  return payload;
};

export const listProducts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
    const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
    const categoryId =
      typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;

    if (categoryId && !validateObjectId(categoryId)) {
      return errorResponse(res, 400, "Invalid category id");
    }

    const result = await ProductService.listProducts({ page, limit, sort, categoryId });

    return res.status(200).json({
      message: "Products fetched successfully",
      result,
    });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const getProductById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const productId = getRouteParam(req.params.productId);

    if (!productId || !validateObjectId(productId)) {
      return errorResponse(res, 400, "Invalid product id");
    }

    const product = await ProductService.getProductById(productId);
    if (!product) {
      return errorResponse(res, 404, "Product not found");
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      result: { product },
    });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const createProduct = async (req: Request, res: Response): Promise<Response> => {
  try {
    const payload = buildCreatePayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(
        res,
        400,
        "Invalid request body. Required fields: name, images, price, category"
      );
    }

    if (!validateObjectId(payload.category)) {
      return errorResponse(res, 400, "Invalid category id");
    }

    const product = await ProductService.createProduct(payload);

    return res.status(201).json({
      message: "Product created successfully",
      result: { product },
    });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const replaceProduct = async (req: Request, res: Response): Promise<Response> => {
  try {
    const productId = getRouteParam(req.params.productId);
    if (!productId || !validateObjectId(productId)) {
      return errorResponse(res, 400, "Invalid product id");
    }

    const payload = buildCreatePayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(
        res,
        400,
        "Invalid request body. Required fields: name, images, price, category"
      );
    }

    if (!validateObjectId(payload.category)) {
      return errorResponse(res, 400, "Invalid category id");
    }

    const product = await ProductService.replaceProduct(productId, payload);
    if (!product) {
      return errorResponse(res, 404, "Product not found");
    }

    return res.status(200).json({
      message: "Product replaced successfully",
      result: { product },
    });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<Response> => {
  try {
    const productId = getRouteParam(req.params.productId);
    if (!productId || !validateObjectId(productId)) {
      return errorResponse(res, 400, "Invalid product id");
    }

    const payload = buildPatchPayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(res, 400, "Invalid request body for update");
    }

    if (payload.category && !validateObjectId(payload.category)) {
      return errorResponse(res, 400, "Invalid category id");
    }

    const product = await ProductService.updateProduct(productId, payload);
    if (!product) {
      return errorResponse(res, 404, "Product not found");
    }

    return res.status(200).json({
      message: "Product updated successfully",
      result: { product },
    });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<Response> => {
  try {
    const productId = getRouteParam(req.params.productId);
    if (!productId || !validateObjectId(productId)) {
      return errorResponse(res, 400, "Invalid product id");
    }

    const product = await ProductService.deleteProduct(productId);
    if (!product) {
      return errorResponse(res, 404, "Product not found");
    }

    return res.status(200).json({
      message: "Product deleted successfully",
      result: { product },
    });
  } catch (error) {
    return mapServiceError(res, error);
  }
};
