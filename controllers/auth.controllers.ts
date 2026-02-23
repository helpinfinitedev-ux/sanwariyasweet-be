import { Request, Response } from "express";
import { signToken } from "../lib/jwt";
import mongoose from "mongoose";
import {
  AuthService,
  AuthServiceError,
  type LoginPayload,
  type RegisterPayload,
} from "../services/auth.service";

const errorResponse = (res: Response, statusCode: number, message: string): Response => {
  return res.status(statusCode).json({
    message,
    result: {},
  });
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const allowedRegisterFields = new Set([
  "firstName",
  "lastName",
  "phoneNumber",
  "address",
  "emailAddress",
  "password",
  "role",
]);
const allowedLoginFields = new Set(["phoneNumber", "password"]);

const hasOnlyAllowedFields = (
  body: Record<string, unknown>,
  allowedFields: Set<string>
): boolean => Object.keys(body).every((key) => allowedFields.has(key));

const sanitizeUser = <T extends Record<string, unknown>>(user: T): Omit<T, "password"> => {
  const sanitized = { ...user };
  delete sanitized.password;
  return sanitized;
};

const buildRegisterPayload = (body: Record<string, unknown>): RegisterPayload | null => {
  if (!hasOnlyAllowedFields(body, allowedRegisterFields)) return null;
  if (!isNonEmptyString(body.firstName)) return null;
  if (!isNonEmptyString(body.lastName)) return null;
  if (!isNonEmptyString(body.phoneNumber)) return null;
  if (!isNonEmptyString(body.address)) return null;
  if (!isNonEmptyString(body.password)) return null;

  const payload: RegisterPayload = {
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    phoneNumber: body.phoneNumber.trim(),
    address: body.address.trim(),
    password: body.password.trim(),
  };

  if ("emailAddress" in body) {
    if (!isNonEmptyString(body.emailAddress)) return null;
    payload.emailAddress = body.emailAddress.trim().toLowerCase();
  }

  if ("role" in body) {
    if (
      body.role !== "admin" &&
      body.role !== "customer" &&
      body.role !== "deliveryPartner"
    ) {
      return null;
    }
    payload.role = body.role;
  }

  return payload;
};

const buildLoginPayload = (body: Record<string, unknown>): LoginPayload | null => {
  if (!hasOnlyAllowedFields(body, allowedLoginFields)) return null;
  if (!isNonEmptyString(body.phoneNumber)) return null;
  if (!isNonEmptyString(body.password)) return null;

  return {
    phoneNumber: body.phoneNumber.trim(),
    password: body.password.trim(),
  };
};

const mapServiceError = (res: Response, error: unknown): Response => {
  if (error instanceof AuthServiceError) {
    return errorResponse(res, error.statusCode, error.message);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return errorResponse(res, 400, error.message);
  }

  console.error("Auth controller error:", error);
  return errorResponse(res, 500, "Internal server error");
};

export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const payload = buildRegisterPayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(
        res,
        400,
        "Invalid request body. Required fields: firstName, lastName, phoneNumber, address, password"
      );
    }

    const user = await AuthService.register(payload);
    const token = signToken(user);

    return res.status(201).json({
      message: "User created successfully",
      result: {
        user: sanitizeUser(user.toObject()),
        token,
      },
    });
  } catch (error) {
    return mapServiceError(res, error);
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const payload = buildLoginPayload(req.body as Record<string, unknown>);
    if (!payload) {
      return errorResponse(
        res,
        400,
        "Invalid request body. Required fields: phoneNumber, password"
      );
    }

    const user = await AuthService.login(payload);
    const token = signToken(user);

    return res.status(200).json({
      message: "Login successful",
      result: {
        user: sanitizeUser(user.toObject()),
        token,
      },
    });
  } catch (error) {
    return mapServiceError(res, error);
  }
};
