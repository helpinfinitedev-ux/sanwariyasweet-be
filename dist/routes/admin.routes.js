"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controllers_1 = require("../controllers/admin.controllers");
const auth_middleware_1 = require("../middleware/auth.middleware");
const testimonial_routes_1 = __importDefault(require("./testimonial.routes"));
const adminRouter = (0, express_1.Router)();
adminRouter.get("/orders", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, admin_controllers_1.adminListOrders);
adminRouter.get("/products", admin_controllers_1.adminListProducts);
adminRouter.get("/users", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, admin_controllers_1.adminListUsers);
adminRouter.use("/testimonials", testimonial_routes_1.default);
exports.default = adminRouter;
