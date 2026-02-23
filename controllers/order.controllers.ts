import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  OrderService,
  OrderServiceError,
  type CreateOrderPayload,
  type UpdateOrderPayload,
} from "../services/order.service";

const errorResponse = (res: Response, statusCode: number, message: string): Response =>
  res.status(statusCode).json({ message, result: {} });

const allowedPayloadFields = new Set([
  "userId",
  "items",
  "address",
  "phoneNumber",
  "expectedDeliveryDate",
  "status",
]);
const allowedPatchPayloadFields = new Set([
  "items",
  "address",
  "phoneNumber",
  "expectedDeliveryDate",
  "status",
]);
const allowedItemFields = new Set(["productId", "quantity", "price", "unit"]);
const allowedStatus = new Set(["pending", "shipped", "in-transit", "delivered"]);
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

const toDate = (value: unknown): Date | null => {
  if (!isNonEmptyString(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getRouteParam = (value: string | string[] | undefined): string | null => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return value[0];
  return null;
};

const parseItems = (
  itemsValue: unknown
): CreateOrderPayload["items"] | UpdateOrderPayload["items"] | null => {
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
  return parsedItems as CreateOrderPayload["items"];
};

const buildCreatePayload = (body: Record<string, unknown>): CreateOrderPayload | null => {
  if (!hasOnlyAllowedFields(body, allowedPayloadFields)) return null;
  if (!isNonEmptyString(body.userId) || !validateObjectId(body.userId.trim())) return null;
  if (!isNonEmptyString(body.address)) return null;
  if (!isNonEmptyString(body.phoneNumber)) return null;

  const items = parseItems(body.items);
  const expectedDeliveryDate = toDate(body.expectedDeliveryDate);
  if (!items || !expectedDeliveryDate) return null;

  if ("status" in body) {
    if (typeof body.status !== "string" || !allowedStatus.has(body.status)) return null;
  }

  return {
    userId: body.userId.trim(),
    items,
    address: body.address.trim(),
    phoneNumber: body.phoneNumber.trim(),
    expectedDeliveryDate,
    status: typeof body.status === "string" ? (body.status as CreateOrderPayload["status"]) : undefined,
  };
};

const buildPatchPayload = (body: Record<string, unknown>): UpdateOrderPayload | null => {
  if (!hasOnlyAllowedFields(body, allowedPatchPayloadFields)) return null;
  const payload: UpdateOrderPayload = {};

  if ("items" in body) {
    const items = parseItems(body.items);
    if (!items) return null;
    payload.items = items;
  }

  if ("address" in body) {
    if (!isNonEmptyString(body.address)) return null;
    payload.address = body.address.trim();
  }

  if ("phoneNumber" in body) {
    if (!isNonEmptyString(body.phoneNumber)) return null;
    payload.phoneNumber = body.phoneNumber.trim();
  }

  if ("expectedDeliveryDate" in body) {
    const expectedDeliveryDate = toDate(body.expectedDeliveryDate);
    if (!expectedDeliveryDate) return null;
    payload.expectedDeliveryDate = expectedDeliveryDate;
  }

  if ("status" in body) {
    if (typeof body.status !== "string" || !allowedStatus.has(body.status)) return null;
    payload.status = body.status as UpdateOrderPayload["status"];
  }

  if (Object.keys(payload).length === 0) return null;
  return payload;
};

const mapServiceError = (res: Response, error: unknown): Response => {
  if (error instanceof OrderServiceError) return errorResponse(res, error.statusCode, error.message);
  if (error instanceof mongoose.Error.ValidationError) return errorResponse(res, 400, error.message);
  console.error("Order controller error:", error);
  return errorResponse(res, 500, "Internal server error");
};

export const listOrders = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
    const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    if (userId && !validateObjectId(userId)) return errorResponse(res, 400, "Invalid user id");
    if (status && !allowedStatus.has(status)) return errorResponse(res, 400, "Invalid status");

    const result = await OrderService.listOrders({
      page,
      limit,
      sort,
      userId,
      status: status as CreateOrderPayload["status"] | undefined,
    });
    return res.status(200).json({ message: "Orders fetched successfully", result });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const orderId = getRouteParam(req.params.orderId);
    if (!orderId || !validateObjectId(orderId)) return errorResponse(res, 400, "Invalid order id");

    const order = await OrderService.getOrderById(orderId);
    if (!order) return errorResponse(res, 404, "Order not found");

    return res.status(200).json({ message: "Order fetched successfully", result: { order } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const createOrder = async (req: Request, res: Response): Promise<Response> => {
  try {
    const payload = buildCreatePayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(
        res,
        400,
        "Invalid request body. Required fields: userId, items, address, phoneNumber, expectedDeliveryDate"
      );
    }

    const order = await OrderService.createOrder(payload);
    return res.status(201).json({ message: "Order created successfully", result: { order } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const replaceOrder = async (req: Request, res: Response): Promise<Response> => {
  try {
    const orderId = getRouteParam(req.params.orderId);
    if (!orderId || !validateObjectId(orderId)) return errorResponse(res, 400, "Invalid order id");

    const payload = buildCreatePayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(
        res,
        400,
        "Invalid request body. Required fields: userId, items, address, phoneNumber, expectedDeliveryDate"
      );
    }

    const order = await OrderService.replaceOrder(orderId, payload);
    if (!order) return errorResponse(res, 404, "Order not found");

    return res.status(200).json({ message: "Order replaced successfully", result: { order } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const updateOrder = async (req: Request, res: Response): Promise<Response> => {
  try {
    const orderId = getRouteParam(req.params.orderId);
    if (!orderId || !validateObjectId(orderId)) return errorResponse(res, 400, "Invalid order id");

    const payload = buildPatchPayload(req.body as Record<string, unknown>);
    if (!payload) return errorResponse(res, 400, "Invalid request body for update");

    const order = await OrderService.updateOrder(orderId, payload);
    if (!order) return errorResponse(res, 404, "Order not found");

    return res.status(200).json({ message: "Order updated successfully", result: { order } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const deleteOrder = async (req: Request, res: Response): Promise<Response> => {
  try {
    const orderId = getRouteParam(req.params.orderId);
    if (!orderId || !validateObjectId(orderId)) return errorResponse(res, 400, "Invalid order id");

    const order = await OrderService.deleteOrder(orderId);
    if (!order) return errorResponse(res, 404, "Order not found");

    return res.status(200).json({ message: "Order deleted successfully", result: { order } });
  } catch (error) {
    return mapServiceError(res, error);
  }
};
