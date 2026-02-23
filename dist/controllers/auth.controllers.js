"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const jwt_1 = require("../lib/jwt");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_service_1 = require("../services/auth.service");
const errorResponse = (res, statusCode, message) => {
    return res.status(statusCode).json({
        message,
        result: {},
    });
};
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
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
const hasOnlyAllowedFields = (body, allowedFields) => Object.keys(body).every((key) => allowedFields.has(key));
const sanitizeUser = (user) => {
    const sanitized = { ...user };
    delete sanitized.password;
    return sanitized;
};
const buildRegisterPayload = (body) => {
    if (!hasOnlyAllowedFields(body, allowedRegisterFields))
        return null;
    if (!isNonEmptyString(body.firstName))
        return null;
    if (!isNonEmptyString(body.lastName))
        return null;
    if (!isNonEmptyString(body.phoneNumber))
        return null;
    if (!isNonEmptyString(body.address))
        return null;
    if (!isNonEmptyString(body.password))
        return null;
    const payload = {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        phoneNumber: body.phoneNumber.trim(),
        address: body.address.trim(),
        password: body.password.trim(),
    };
    if ("emailAddress" in body) {
        if (!isNonEmptyString(body.emailAddress))
            return null;
        payload.emailAddress = body.emailAddress.trim().toLowerCase();
    }
    if ("role" in body) {
        if (body.role !== "admin" &&
            body.role !== "customer" &&
            body.role !== "deliveryPartner") {
            return null;
        }
        payload.role = body.role;
    }
    return payload;
};
const buildLoginPayload = (body) => {
    if (!hasOnlyAllowedFields(body, allowedLoginFields))
        return null;
    if (!isNonEmptyString(body.phoneNumber))
        return null;
    if (!isNonEmptyString(body.password))
        return null;
    return {
        phoneNumber: body.phoneNumber.trim(),
        password: body.password.trim(),
    };
};
const mapServiceError = (res, error) => {
    if (error instanceof auth_service_1.AuthServiceError) {
        return errorResponse(res, error.statusCode, error.message);
    }
    if (error instanceof mongoose_1.default.Error.ValidationError) {
        return errorResponse(res, 400, error.message);
    }
    console.error("Auth controller error:", error);
    return errorResponse(res, 500, "Internal server error");
};
const register = async (req, res) => {
    try {
        const payload = buildRegisterPayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body. Required fields: firstName, lastName, phoneNumber, address, password");
        }
        const user = await auth_service_1.AuthService.register(payload);
        const token = (0, jwt_1.signToken)(user);
        return res.status(201).json({
            message: "User created successfully",
            result: {
                user: sanitizeUser(user.toObject()),
                token,
            },
        });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const payload = buildLoginPayload(req.body);
        if (!payload) {
            return errorResponse(res, 400, "Invalid request body. Required fields: phoneNumber, password");
        }
        const user = await auth_service_1.AuthService.login(payload);
        const token = (0, jwt_1.signToken)(user);
        return res.status(200).json({
            message: "Login successful",
            result: {
                user: sanitizeUser(user.toObject()),
                token,
            },
        });
    }
    catch (error) {
        return mapServiceError(res, error);
    }
};
exports.login = login;
