"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
dotenv_1.default.config();
// Connect to MongoDB before handling requests
let isConnected = false;
const handler = async (req, res) => {
    if (!isConnected) {
        await (0, db_1.default)();
        isConnected = true;
    }
    return (0, app_1.default)(req, res);
};
// Export for Vercel serverless
exports.default = handler;
