"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGODB_URL;
        if (!mongoUrl) {
            throw new Error("MONGODB_URL is not defined in environment variables");
        }
        await mongoose_1.default.connect(mongoUrl);
        console.log("db connected");
    }
    catch (error) {
        console.error("db error:", error);
        throw error;
    }
};
exports.default = connectDB;
