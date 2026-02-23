import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  CartService,
  CartServiceError,
  type CreateCartPayload,
  type UpdateCartPayload,
} from "../services/cart.service";

const errorResponse = (res: Response, statusCode: number, message: string): Response =>
  res.status(statusCode).json({ message, result: {} });

const allowedPayloadFields = new Set(["userId", "items"]);
const allowedItemFields = new Set(["productId", "quantity", "price", "unit"]);
const allowedUnits = new Set(["kg", "g", "pcs"]);

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

const toPositiveNumber = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const toNonNegativeNumber = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
};

const getRouteParam = (value: string | string[] | undefined): string | null => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return value[0];
  return null;
};

const parseItems = (
  itemsValue: unknown
): CreateCartPayload["items"] | UpdateCartPayload["items"] | null => {
  if (!Array.isArray(itemsValue) || itemsValue.length === 0) return null;

  const parsedItems = itemsValue.map((item) => {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    if (!hasOnlyAllowedFields(record, allowedItemFields)) return null;
    if (!isNonEmptyString(record.productId)) return null;
    if (!validateObjectId(record.productId.trim())) return null;

    const quantity = toPositiveNumber(record.quantity);
    const price = toNonNegativeNumber(record.price);
    if (quantity === null || price === null) return null;

    if (typeof record.unit !== "string" || !allowedUnits.has(record.unit)) return null;

    return {
      productId: record.productId.trim(),
      quantity,
      price,
      unit: record.unit as "kg" | "g" | "pcs",
    };
  });

  if (parsedItems.some((item) => item === null)) return null;
  return parsedItems as CreateCartPayload["items"];
};

const buildCreatePayload = (body: Record<string, unknown>): CreateCartPayload | null => {
  if (!hasOnlyAllowedFields(body, allowedPayloadFields)) return null;
  if (!isNonEmptyString(body.userId)) return null;
  if (!validateObjectId(body.userId.trim())) return null;

  const items = parseItems(body.items);
  if (!items) return null;

  return {
    userId: body.userId.trim(),
    items,
  };
};

const buildPatchPayload = (body: Record<string, unknown>): UpdateCartPayload | null => {
  if (!hasOnlyAllowedFields(body, new Set(["items"]))) return null;

  const payload: UpdateCartPayload = {};
  if ("items" in body) {
    const items = parseItems(body.items);
    if (!items) return null;
    payload.items = items;
  }

  if (Object.keys(payload).length === 0) return null;
  return payload;
};

const mapServiceError = (res: Response, error: unknown): Response => {
  if (error instanceof CartServiceError) return errorResponse(res, error.statusCode, error.message);
  if (error instanceof mongoose.Error.ValidationError) return errorResponse(res, 400, error.message);
  console.error("Cart controller error:", error);
  return errorResponse(res, 500, "Internal server error");
};

export const listCarts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
    const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;

    if (userId && !validateObjectId(userId)) return errorResponse(res, 400, "Invalid user id");

    const result = await CartService.listCarts({ page, limit, sort, userId });
    return res.status(200).json({ message: "Carts fetched successfully", result });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const getCartById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const cartId = getRouteParam(req.params.cartId);
    if (!cartId || !validateObjectId(cartId)) return errorResponse(res, 400, "Invalid cart id");

    const cart = await CartService.getCartById(cartId);
    if (!cart) return errorResponse(res, 404, "Cart not found");

    return res.status(200).json({ message: "Cart fetched successfully", result: { cart } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const createCart = async (req: Request, res: Response): Promise<Response> => {
  try {
    const payload = buildCreatePayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(res, 400, "Invalid request body. Required fields: userId, items");
    }

    const cart = await CartService.createCart(payload);
    return res.status(201).json({ message: "Cart created successfully", result: { cart } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const replaceCart = async (req: Request, res: Response): Promise<Response> => {
  try {
    const cartId = getRouteParam(req.params.cartId);
    if (!cartId || !validateObjectId(cartId)) return errorResponse(res, 400, "Invalid cart id");

    const payload = buildCreatePayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(res, 400, "Invalid request body. Required fields: userId, items");
    }

    const cart = await CartService.replaceCart(cartId, payload);
    if (!cart) return errorResponse(res, 404, "Cart not found");

    return res.status(200).json({ message: "Cart replaced successfully", result: { cart } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const updateCart = async (req: Request, res: Response): Promise<Response> => {
  try {
    const cartId = getRouteParam(req.params.cartId);
    if (!cartId || !validateObjectId(cartId)) return errorResponse(res, 400, "Invalid cart id");

    const payload = buildPatchPayload(req.body as Record<string, unknown>);
    if (!payload) return errorResponse(res, 400, "Invalid request body for update");

    const cart = await CartService.updateCart(cartId, payload);
    if (!cart) return errorResponse(res, 404, "Cart not found");

    return res.status(200).json({ message: "Cart updated successfully", result: { cart } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const deleteCart = async (req: Request, res: Response): Promise<Response> => {
  try {
    const cartId = getRouteParam(req.params.cartId);
    if (!cartId || !validateObjectId(cartId)) return errorResponse(res, 400, "Invalid cart id");

    const cart = await CartService.deleteCart(cartId);
    if (!cart) return errorResponse(res, 404, "Cart not found");

    return res.status(200).json({ message: "Cart deleted successfully", result: { cart } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};
