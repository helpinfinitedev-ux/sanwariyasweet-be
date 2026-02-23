"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.AuthServiceError = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = __importDefault(require("../models/user.model"));
class AuthServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "AuthServiceError";
        this.statusCode = statusCode;
    }
}
exports.AuthServiceError = AuthServiceError;
exports.AuthService = {
    async register(payload) {
        const existingPhone = await user_model_1.default.findOne({ phoneNumber: payload.phoneNumber });
        if (existingPhone) {
            throw new AuthServiceError("User with this phone number already exists", 409);
        }
        if (payload.emailAddress) {
            const existingEmail = await user_model_1.default.findOne({ emailAddress: payload.emailAddress });
            if (existingEmail) {
                throw new AuthServiceError("User with this email address already exists", 409);
            }
        }
        const hashedPassword = await bcryptjs_1.default.hash(payload.password, 10);
        return user_model_1.default.create({
            firstName: payload.firstName,
            lastName: payload.lastName,
            phoneNumber: payload.phoneNumber,
            address: payload.address,
            emailAddress: payload.emailAddress,
            password: hashedPassword,
            role: payload.role ?? "customer",
        });
    },
    async login(payload) {
        const user = await user_model_1.default.findOne({ phoneNumber: payload.phoneNumber }).select("+password");
        if (!user || !user.password) {
            throw new AuthServiceError("Invalid credentials", 401);
        }
        const isPasswordValid = await bcryptjs_1.default.compare(payload.password, user.password);
        if (!isPasswordValid) {
            throw new AuthServiceError("Invalid credentials", 401);
        }
        return user;
    },
};
