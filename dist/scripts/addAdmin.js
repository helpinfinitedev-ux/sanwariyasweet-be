"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../config/db"));
const auth_service_1 = require("../services/auth.service");
const addAdmin = async () => {
    await (0, db_1.default)();
    const payload = {
        firstName: "Sanwariya",
        lastName: "Admin",
        phoneNumber: "8960565915",
        emailAddress: "admin@sanwariya.com",
        password: "admin123",
        address: "Jaunpur",
        role: "admin",
    };
    await auth_service_1.AuthService.register(payload);
};
addAdmin();
