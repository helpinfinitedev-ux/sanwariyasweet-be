"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controllers_1 = require("../controllers/auth.controllers");
const authRouter = (0, express_1.Router)();
authRouter.post("/register", auth_controllers_1.register);
authRouter.post("/login", auth_controllers_1.login);
exports.default = authRouter;
